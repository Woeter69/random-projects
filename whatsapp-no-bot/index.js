const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Configuration
// You can set this via environment variable: export TARGET_ID="123456789@c.us"
const TARGET_ID = process.env.TARGET_ID; 

console.log('Initializing WhatsApp Client...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    if (!TARGET_ID) {
        console.log('-----------------------------------------------------------');
        console.log('WARNING: TARGET_ID is not set.');
        console.log('The bot is running in DISCOVERY MODE.');
        console.log('1. Send the message "!id" to the bot (or in the group you want to target).');
        console.log('2. The bot will reply with the Chat ID.');
        console.log('3. Stop the bot (Ctrl+C).');
        console.log('4. Run: export TARGET_ID="<copied_id>" && node index.js');
        console.log('-----------------------------------------------------------');
    } else {
        console.log(`Bot is ACTIVE. Auto-replying "No" to: ${TARGET_ID}`);
    }
});

client.on('message', async msg => {
    // Log all incoming messages for debugging/discovery
    console.log(`[MSG] From: ${msg.from} | Body: ${msg.body.substring(0, 50)}...`);

    // Utility command to get ID
    if (msg.body.trim() === '!id') {
        await msg.reply(`Chat ID: ${msg.from}`);
        console.log(`Sent ID to ${msg.from}`);
        return;
    }

    // Main Logic
    if (TARGET_ID && msg.from === TARGET_ID) {
        try {
            // Fetch "No" from NaaS
            const response = await axios.get('https://naas.isalman.dev/no');
            // The API returns { "reason": "..." }
            const replyText = response.data.reason || 'No.';
            
            await msg.reply(replyText);
            console.log(`Replied to ${msg.from}: "${replyText}"`);
        } catch (error) {
            console.error('Error fetching NaaS:', error.message);
            // Fallback
            await msg.reply('No.');
        }
    }
});

client.initialize();
