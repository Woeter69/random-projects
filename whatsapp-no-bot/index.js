const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');

// Setup Web Server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 49876;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // Default password

let client; // Move to higher scope

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'whatsapp-bot-secret',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        req.session.username = 'User-' + Math.floor(Math.random() * 1000);
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// Auth Middleware for protected routes
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
};

app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// DEBUG: Screenshot route
app.get('/debug/screenshot', async (req, res) => {
    if (!client || !client.pupPage) {
        return res.status(503).send('Browser not ready yet.');
    }
    try {
        const buffer = await client.pupPage.screenshot();
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        res.status(500).send(`Error taking screenshot: ${err.message}`);
    }
});

// DEBUG: Reset Session
app.get('/debug/reset', async (req, res) => {
    try {
        const authPath = path.join(__dirname, '.wwebjs_auth');
        broadcastLog('Resetting session... Deleting auth folder.');
        if (client) {
            try { await client.destroy(); } catch (e) {}
        }
        
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }
        
        broadcastLog('Session deleted. Restarting process...');
        res.send('Session reset. Container should restart or re-init.');
        
        setTimeout(() => process.exit(0), 1000); // Allow response to send
    } catch (err) {
        res.status(500).send(`Error resetting: ${err.message}`);
    }
});

// Serve other static files (js, css)
app.use(express.static(path.join(__dirname, 'public')));

// Config
const CONFIG_PATH = path.join(__dirname, 'config.json');
let TARGET_NUMBER = null;

// State Cache
let currentQR = null;
let currentStatus = 'Initializing...';

// Track Connected Users
let connectedUsers = new Map(); // socket.id -> username

// Helper to broadcast logs
const broadcastLog = (message, type = 'info') => {
    console.log(message); 
    io.emit('log', { message, type });
};

const saveConfig = (number) => {
    try {
        TARGET_NUMBER = number;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ target: TARGET_NUMBER }, null, 2));
        broadcastLog(`Config saved. Target: +${TARGET_NUMBER}`);
        io.emit('target', TARGET_NUMBER);
    } catch (err) {
        broadcastLog(`Failed to save config: ${err.message}`, 'error');
    }
};

const init = async () => {
    // 1. Load Config
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            if (config.target) {
                TARGET_NUMBER = config.target;
            }
        } catch (err) {
            console.error('Error reading config.json:', err.message);
        }
    }

    // 2. Initialize WhatsApp Client
    const authPath = path.join(__dirname, '.wwebjs_auth');
    try {
        if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
        }
        fs.accessSync(authPath, fs.constants.W_OK);
        broadcastLog(`Auth directory is writable: ${authPath}`);
    } catch (err) {
        broadcastLog(`ERROR: Auth directory is NOT writable: ${err.message}`, 'error');
    }

    broadcastLog('Initializing WhatsApp Client...');

    client = new Client({
        authStrategy: new LocalAuth(),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=site-per-process'
            ],
            headless: true,
            dumpio: true,
            bypassCSP: true
        }
    });

    client.on('loading_screen', (percent, message) => {
        broadcastLog(`Loading WhatsApp Web... ${percent}% ${message || ''}`);
    });

    // DEBUG: Monitor Page State
    setInterval(async () => {
        if (client && client.pupPage) {
            try {
                const url = client.pupPage.url();
                const title = await client.pupPage.title();
                const hasQR = await client.pupPage.evaluate(() => !!document.querySelector('canvas'));
                const bodyLength = await client.pupPage.evaluate(() => document.body.innerHTML.length);
                
                console.log(`[DEBUG] URL: ${url} | Title: "${title}" | Has QR: ${hasQR} | Body Len: ${bodyLength}`);
            } catch (err) {
            }
        }
    }, 5000);

    client.on('qr', (qr) => {
        broadcastLog('QR Code received. Scan on Web Interface or Terminal.');
        qrcode.generate(qr, { small: true }); 
        
        QRCode.toDataURL(qr, (err, url) => {
            if (!err) {
                currentQR = url;
                io.emit('qr', url);
            }
        });
        
        currentStatus = 'QR_Waiting';
        io.emit('status', { status: 'QR_Waiting' });
    });

    client.on('authenticated', () => {
        broadcastLog('AUTHENTICATED successfully!');
        currentStatus = 'AUTHENTICATED';
        io.emit('status', { status: 'AUTHENTICATED' });
        currentQR = null;
    });

    client.on('auth_failure', (msg) => {
        broadcastLog(`AUTHENTICATION FAILURE: ${msg}`, 'error');
        currentStatus = 'AUTH_FAILURE';
        io.emit('status', { status: 'AUTH_FAILURE' });
    });

    client.on('disconnected', async (reason) => {
        broadcastLog(`Client DISCONNECTED: ${reason}`, 'error');
        currentStatus = 'DISCONNECTED';
        io.emit('status', { status: 'DISCONNECTED' });
        
        // Destroy and re-initialize to generate new QR
        try {
            await client.destroy();
        } catch (ignored) {}
        
        broadcastLog('Re-initializing client...');
        client.initialize();
    });

    client.on('ready', () => {
        broadcastLog('Client is ready!');
        currentStatus = 'READY';
        io.emit('status', { status: 'READY' });
        if (TARGET_NUMBER) {
            broadcastLog(`Bot is ACTIVE. Target: +${TARGET_NUMBER}`);
            io.emit('target', TARGET_NUMBER);
        }
    });

    client.on('message', async msg => {
        const contact = await msg.getContact();
        const senderNumber = contact.number; 
        
        if (msg.body.trim().toLowerCase() === '!set-target') {
            saveConfig(senderNumber);
            await msg.reply(`Target set to: +${senderNumber}`);
            return;
        }

        if (TARGET_NUMBER && senderNumber === TARGET_NUMBER) {
            try {
                const response = await axios.get('https://naas.isalman.dev/no');
                await msg.reply(response.data.reason || 'No.');
            } catch (error) {
                await msg.reply('No.');
            }
        }
    });

    broadcastLog('Starting Client initialization...');
    client.initialize().catch(err => {
        broadcastLog(`Client initialization FAILED: ${err.message}`, 'error');
    });

    // Socket Connection
    io.on('connection', (socket) => {
        const username = 'User-' + Math.floor(Math.random() * 10000);
        connectedUsers.set(socket.id, username);
        io.emit('users-list', Array.from(connectedUsers.values()));

        // Send current state to new user
        if (currentStatus) socket.emit('status', { status: currentStatus });
        if (currentQR && currentStatus === 'QR_Waiting') socket.emit('qr', currentQR);
        if (TARGET_NUMBER) socket.emit('target', TARGET_NUMBER);

        socket.on('update-target', (newNumber) => {
            if (!newNumber) return;
            const cleaned = newNumber.replace(/\D/g, '');
            if (cleaned.length > 5) saveConfig(cleaned);
        });

        socket.on('logout', async () => {
            if (client) {
                broadcastLog('Logging out requested by user...');
                try {
                    await client.logout();
                } catch (err) {
                    broadcastLog(`Logout failed: ${err.message}`, 'error');
                }
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(socket.id);
            io.emit('users-list', Array.from(connectedUsers.values()));
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

init();