"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

// Import all dependencies, mostly using destructuring for better view.
const bot_sdk_1 = require("@line/bot-sdk");
const express_1 = __importDefault(require("express"));
var request = require('request'); // "Request" library
const fs = require('fs'); // fs Module to read/write JSON files
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
const res = require("express/lib/response");
const { redirect } = require("express/lib/response");
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
const PLAYLIST = PLAYLIST_ID_TEST;

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

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
// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));
// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get('/', async (_, res) => {

    res.redirect('/manual-update-local-data');

    // return res.status(200).json({
    //     status: 'success',
    //     message: 'Connected successfully!',
    // });
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
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
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
                // var shareLink = body.tracks.items[lastItemIndex].track.album.external_urls.spotify;
                var testMImageURL = body.tracks.items[lastItemIndex].track.album.images[0].url;
                var testSImageURL = body.tracks.items[lastItemIndex].track.album.images[1].url;

                // Determine userName from userId:
                var userIdOptions = {
                    url: 'https://api.spotify.com/v1/users/' + userId,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    json: true
                };

                request.get(userIdOptions, function (error, response, body) {

                    // Get previous value of Total stored
                    let rawdata = fs.readFileSync('total.json');
                    let databaseValue = JSON.parse(rawdata);

                    // Update database value to current value
                    databaseValue.total = total;
                    fs.writeFileSync('total.json', JSON.stringify(databaseValue));

                    // Parse through response
                    var userName = body.display_name;

                    // Compose message with Template Literals (Template Strings)
                    var data = `A new song has been added to the playlist! \n\n${userName} has added the song "${trackTitle}" by ${artist}.\n\nThere are now ${total} songs in the playlist.`;

                    // Create a new message.
                    const textMessage = {
                        type: 'text',
                        text: data,
                    };

                    // Create a new image message.
                    const imageMessage = {
                        type: 'image',
                        originalContentUrl: testMImageURL,
                        previewImageUrl: testSImageURL
                    };

                    // Create a new image message.
                    // const imageMapMessage = {
                    //     type: 'message',
                    //     label: 'https://open.spotify.com/track/04479xELLnZLEZxoy0iWFL?si=3a4f0d2f53414a05',
                    //     text: 'https://open.spotify.com/track/04479xELLnZLEZxoy0iWFL?si=3a4f0d2f53414a05',
                    //     area: {
                    //         x: 0,
                    //         y: 0,
                    //         width: 520,
                    //         height: 1040
                    //     }
                    // }

                    // Broadcast with SDK client function
                    return client.broadcast([textMessage, imageMessage]);
                    // return client.broadcast(imageMapMessage);
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

// Get previous value of Total stored
let rawdata = fs.readFileSync('total.json');
let databaseValue = JSON.parse(rawdata);
// console.log(databaseValue.total);

// This route will check for changes in the playlist and run /broadcast if there are changes
app.get('/ping', async (_, res) => {

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            request.get(playlistOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    // Parse through response
                    var total = body.tracks.total;

                    // Check if Spotify API total value is different from previously saved total value
                    // Get previous value of Total stored
                    let rawdata = fs.readFileSync('total.json');
                    let databaseValue = JSON.parse(rawdata);


                    // console.log(databaseValue['total'], total);
                    if (databaseValue['total'] != total) {
                        console.log(databaseValue['total'], total);
                        res.redirect('/broadcast');
                    }

                    res.end();
                }
            });
        };
    });
});


app.get('/playlist', async (_, res) => {
    // PHILLIP TEST--------------------------------------------------
    // SPOTIFY ----------------------------------------------------------
    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
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

                var testMImageURL = body.tracks.items[lastItemIndex].track.album.images[0].url;
                var testSImageURL = body.tracks.items[lastItemIndex].track.album.images[1].url;
                var data = `A new song has been added to the playlist! \n\n"${trackTitle}" by ${artist}.\n\nThere are now ${total} songs in the playlist.`;

                // Create text message.
                const textMessage = {
                    type: 'text',
                    text: data
                };

                // Create a new image message.
                const imageMessage = {
                    type: 'image',
                    originalContentUrl: testMImageURL,
                    previewImageUrl: testSImageURL
                };

                client.broadcast([textMessage, imageMessage]);
                res.end();
            });
        }
    });
});

app.get('/check-local-data', async (_, res) => {

    // Get local database value
    let data = fs.readFileSync('total.json');
    let databaseValue = JSON.parse(data);

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            request.get(playlistOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    // Parse through response
                    var spotifyTotal = body.tracks.total;

                    res.send({ databaseValue, spotifyTotal });
                    res.end();
                }
            });
        };
    });
});

app.get('/manual-update-local-data', async (_, res) => {

    // Get local database value
    let data = fs.readFileSync('total.json');
    let databaseValue = JSON.parse(data);

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            var playlistOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            request.get(playlistOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    // Parse through response
                    var spotifyTotal = body.tracks.total;

                    // Update database value to current value
                    databaseValue.total = spotifyTotal;
                    fs.writeFileSync('total.json', JSON.stringify(databaseValue));

                    res.send({ databaseValue, spotifyTotal });
                    res.end();
                }
            });
        };
    });
});

// Create a server and listen to it.
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});