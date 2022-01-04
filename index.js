"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

// Import all dependencies, mostly using destructuring for better view.
const bot_sdk_1 = require("@line/bot-sdk");
const express_1 = __importDefault(require("express"));
var request = require('request'); // "Request" library
const https = require('http');
require('dotenv').config()  // pre-loaded instead using '$ node -r dotenv/config app.js'

// Setup all LINE client and Express configurations.
const clientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET,
};
const middlewareConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET || '',
};

const PORT = process.env.PORT || 3000;

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

SPOTIFY SECTION

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// SPOTIFY VARIABLES ----------------------------------------------------------
var express = require('express'); // Express web server framework
var cors = require('cors');
var cookieParser = require('cookie-parser');
var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret

// your application requests authorization
var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

// Populate collab playlist data
const PLAYLIST_ID_COLLAB = '2akbzrAFt9L9BCjhaQGyUc';
const PLAYLIST_ID_TEST = '53kbHaKSd8NMsutfybeRSz';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/playlist', function (req, res) {

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST_ID_TEST,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            request.get(playlistOptions, function (error, response, body) {

                // Parse through response
                var trackTitle = body.tracks.items[0].track.name;
                var artist = body.tracks.items[0].track.artists[0].name;
                var addedBy = body.tracks.items[0].added_by.id;
                var total = body.tracks.total;

                // Pretty print results
                return res.send({
                    Title: trackTitle,
                    Artist: artist,
                    AddedByPerson: addedBy,
                    TrackTotal: total,
                });
            });
        }
    });
});



/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

LINE SECTION 

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// Create a new LINE SDK client.
const client = new bot_sdk_1.Client(clientConfig);
// Create a new Express application.
// const app = express_1.default();
// Function handler to receive the text.
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
// PHILLIP TEST--------------------------------------------------
// PHILLIP TEST: This route is used to broadcast a message
// Function handler to broadcast message.
const broadcastEventHandler = async (broadcastMessage) => {


    // Create a new message.
    const messages = {
        type: 'text',
        text: broadcastMessage,//'Broadcast message test -PL',
    };

    // Broadcast with SDK client function
    return client.broadcast(messages);
};

// PHILLIP TEST--------------------------------------------------
// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));
// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get('/', async (_, res) => {

    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// TODO fix the callback hell below
// Route handler to broadcast a message.
app.get('/broadcast', async (_, res) => {
    // PHILLIP TEST--------------------------------------------------
    // SPOTIFY ----------------------------------------------------------
    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST_ID_COLLAB, //PLAYLIST_ID_TEST,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            request.get(playlistOptions, function (error, response, body) {

                // Parse through response
                const lastItemIndex = body.tracks.items.length - 1;
                var trackTitle = body.tracks.items[lastItemIndex].track.name;
                var artist = body.tracks.items[lastItemIndex].track.artists[0].name;
                var userId = body.tracks.items[lastItemIndex].added_by.id;
                var total = body.tracks.total;


                // Determine userName from userId:
                var userIdOptions = {
                    url: 'https://api.spotify.com/v1/users/' + userId,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    json: true
                };

                request.get(userIdOptions, function (error, response, body) {

                    // Parse through response
                    var userName = body.display_name;

                    // Compose message
                    var data = "A new song has been added to the playlist! \n\n" + userName + " has added the song '" + trackTitle + "' by " + artist + ".\n\n There are now " + total + " songs in the playlist.";

                    // Send message
                    broadcastEventHandler(data);
                });
            });
        }
    });
    // SPOTIFY ----------------------------------------------------------
    // PHILLIP TEST--------------------------------------------------

    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// This route is used for the Webhook.
app.post('/webhook', bot_sdk_1.middleware(middlewareConfig), async (req, res) => {
    const events = req.body.events;
    // Process all of the received events asynchronously.
    const results = await Promise.all(events.map(async (event) => {
        try {
            await textEventHandler(event);
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(err);
            }
            // Return an error message.
            return res.status(500).json({
                status: 'error',
            });
        }
    }));
    // Return a successfull message.
    return res.status(200).json({
        status: 'success',
        results,
    });
});
// Create a server and listen to it.
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});
