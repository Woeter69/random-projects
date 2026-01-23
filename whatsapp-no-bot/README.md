# WhatsApp "No" Bot

This bot logs into WhatsApp, listens for messages from a specific person or group, and replies "No" (using the [NaaS API](https://naas.isalman.dev/no)) to everything they say.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

## How to Use

### Step 1: Find the Target ID
First, you need to know the unique ID of the person or group you want to annoy.

1.  Run the bot without any configuration:
    ```bash
    node index.js
    ```
2.  Scan the QR code with your WhatsApp mobile app (Linked Devices).
3.  Once logged in, send the message `!id` to the person or group you want to target.
    *   *Note: The bot will reply with the ID (e.g., `123456789@c.us` or `123456789-123@g.us`).*
4.  Copy that ID.
5.  Stop the bot (`Ctrl + C`).

### Step 2: Run the Bot
Run the bot with the `TARGET_ID` environment variable set to the ID you copied.

```bash
export TARGET_ID="123456789@c.us" # Replace with the actual ID
node index.js
```

Now, every message received from that ID will get a "No" reply.
