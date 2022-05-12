require('dotenv').config({path: '../.env'});    

// Setup all LINE client configurations.
const lineClientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET,
};

module.exports = lineClientConfig;