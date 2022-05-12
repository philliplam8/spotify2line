const line = require("@line/bot-sdk");
require('dotenv').config({ path: '../.env' });
const lineClientConfig = require('../configs/line.config.js');

// Create a new LINE SDK client.
const client = new line.Client(lineClientConfig);

// Currently unused
// Function handler to receive the text (for webhook).
const textEventHandler = async (event) => {
    // Process all variables here.
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }

    // Process all message related variables here.
    const { replyToken } = event;
    const { text } = event.message;

    // Create a new message.
    const response = {
        type: 'text',
        text,
    };

    // Reply to the user.
    await client.replyMessage(replyToken, response);
};

module.exports = {
    textEventHandler,
} 