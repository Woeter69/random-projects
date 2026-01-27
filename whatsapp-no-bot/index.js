const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
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

// Serve other static files (js, css) - allow public access or protect them?
// Let's allow public access to assets to avoid complex regex
app.use(express.static(path.join(__dirname, 'public')));

// Config
const CONFIG_PATH = path.join(__dirname, 'config.json');
let TARGET_NUMBER = null;

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
    broadcastLog('Initializing WhatsApp Client...');

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu'
            ],
            headless: true
        }
    });

    client.on('qr', (qr) => {
        broadcastLog('QR Code received. Scan on Web Interface or Terminal.');
        qrcode.generate(qr, { small: true }); 
        io.emit('qr', qr);
        io.emit('status', { status: 'QR_Waiting' });
    });

    client.on('ready', () => {
        broadcastLog('Client is ready!');
        io.emit('status', { status: 'READY' });
        if (TARGET_NUMBER) {
            broadcastLog(`Bot is ACTIVE. Target: +${TARGET_NUMBER}`);
            io.emit('target', TARGET_NUMBER);
        } else {
            broadcastLog('Bot is READY but NO TARGET set.');
        }
    });

    client.on('message', async msg => {
        const contact = await msg.getContact();
        const name = contact.name || contact.pushname || 'Unknown';
        const senderNumber = contact.number; 
        const body = msg.body.substring(0, 50);
        
        broadcastLog(`[MSG] From: ${name} (+${senderNumber}) | Body: ${body}...`);

        if (msg.body.trim().toLowerCase() === '!set-target') {
            if (senderNumber) {
                saveConfig(senderNumber);
                await msg.reply(`Target set to phone number: +${senderNumber}`);
            } else {
                await msg.reply('Could not resolve your phone number.');
            }
            return;
        }

        if (TARGET_NUMBER && senderNumber === TARGET_NUMBER) {
            try {
                const response = await axios.get('https://naas.isalman.dev/no');
                const replyText = response.data.reason || 'No.';
                
                await msg.reply(replyText);
                broadcastLog(`Replied to ${name}: "${replyText}"`);
            } catch (error) {
                broadcastLog(`Error fetching NaaS: ${error.message}`, 'error');
                await msg.reply('No.');
            }
        }
    });

    client.initialize();

    // Socket Connection
    io.on('connection', (socket) => {
        // Assign a random username
        const username = 'User-' + Math.floor(Math.random() * 10000);
        connectedUsers.set(socket.id, username);
        
        // Broadcast user list
        io.emit('users-list', Array.from(connectedUsers.values()));
        broadcastLog(`${username} connected to dashboard.`);

        socket.emit('log', { message: 'Connected to Bot Web Interface', type: 'info' });
        if (TARGET_NUMBER) socket.emit('target', TARGET_NUMBER);
        
        socket.on('update-target', (newNumber) => {
            if (!newNumber) return;
            const cleaned = newNumber.replace(/\D/g, '');
            if (cleaned.length > 5) {
                saveConfig(cleaned);
            } else {
                socket.emit('log', { message: 'Invalid number format. Use country code + digits.', type: 'error' });
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(socket.id);
            io.emit('users-list', Array.from(connectedUsers.values()));
            // broadcastLog(`${username} disconnected.`); // Optional: too noisy?
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

init();
