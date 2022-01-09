"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

// Import all dependencies, mostly using destructuring for better view.
const bot_sdk_1 = require("@line/bot-sdk");
var request = require('request'); // "Request" library

const fs = require('fs'); // fs Module to read/write JSON files
require('dotenv').config()  // pre-loaded instead using '$ node -r dotenv/config app.js'

var express = require('express'); // Express web server framework
var cors = require('cors');
var cookieParser = require('cookie-parser');
const res = require("express/lib/response");
const { redirect } = require("express/lib/response");

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
const SPOTIFY_LOGO_URL = "https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png";
var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret

// Playlist Data
const COLLAB_PLAYLIST = process.env.PLAYLIST_ID_COLLAB;
const TEST_PLAYLIST = process.env.PLAYLIST_ID_TEST;
const PLAYLIST = TEST_PLAYLIST;

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

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

LINE SECTION 

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// Create a new LINE SDK client.
const client = new bot_sdk_1.Client(clientConfig);

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

// LINE quick reply message badge label only allows >= 20 characters
function shortenArtistName(name) {
    // Show full artist name if less than 20
    if (name.length <= 20) {
        return name;
    }
    // Otherwise shorten artist name with ellipsis
    else {
        return name.substring(0, 17) + "...";
    }
}

// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));


/********************************************************************

 APP ROUTES

 *******************************************************************/

// Root Route
app.get('/', async (_, res) => {

    // Initiate an update on startup so that route '/ping/' will not broadcast
    // (in case FreshPing/Heroku restarts)
    res.redirect('/manual-update-local-data');

    // return res.status(200).json({
    //     status: 'success',
    //     message: 'Connected successfully!',
    // });
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

// This route is used to broadcast the latest playlist song to all friends
// TODO fix the callback hell below
app.get('/broadcast', async (_, res) => {

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
                var lastItemIndex = body.tracks.items.length - 1;
                var trackTitle = body.tracks.items[lastItemIndex].track.name;

                var artist = body.tracks.items[lastItemIndex].track.artists[0].name;
                var artistSubstring = shortenArtistName(artist);

                var userId = body.tracks.items[lastItemIndex].added_by.id;
                var total = body.tracks.total;

                var testMImageURL = body.tracks.items[lastItemIndex].track.album.images[0].url;
                var testSImageURL = body.tracks.items[lastItemIndex].track.album.images[1].url;

                var albumLink = body.external_urls.spotify;
                var songLink = body.tracks.items[lastItemIndex].track.external_urls.spotify;
                var artistLink = body.tracks.items[lastItemIndex].track.artists[0].external_urls.spotify;

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
                    var data = `I just added the song "${trackTitle}" by ${artist}.\n\nThere are now ${total} songs in the playlist.`;

                    // Create a new message.
                    const textMessage = {
                        type: 'text',
                        text: data,
                        // Sender will appear in the notification push and in the convo
                        sender: {
                            name: userName,
                            iconUrl: "https://static.wikia.nocookie.net/line/images/1/10/2015-cony.png/revision/latest/scale-to-width-down/490?cb=20150806042102"
                        }
                    };

                    // Create a new image message.
                    const imageMessage = {
                        type: 'image',
                        originalContentUrl: testMImageURL,
                        previewImageUrl: testSImageURL
                    };

                    // Create a quick reply button 
                    // NOTE:
                    // - REPLY BADGES ONLY WORK APPEAR ON MOBILE
                    // - Label only allows max 20 char
                    const quickReplyButton = {
                        type: 'image',
                        originalContentUrl: testMImageURL,
                        previewImageUrl: testSImageURL,
                        quickReply: {
                            items: [
                                {
                                    // Quick reply to view song in Spotify
                                    type: "action",
                                    action: {
                                        type: "uri",
                                        label: "Check out song! 🎵",
                                        uri: songLink
                                    },
                                    imageUrl: testSImageURL
                                },
                                {
                                    // Quick reply to view artist in Spotify
                                    type: "action",
                                    action: {
                                        type: "uri",
                                        label: artistSubstring,
                                        uri: artistLink
                                    },
                                    imageUrl: SPOTIFY_LOGO_URL
                                },
                                {
                                    // Quick reply to view playlist in Spotify
                                    type: "action",
                                    action: {
                                        type: "uri",
                                        label: "Open Playlist 👁👄👁",
                                        uri: albumLink
                                    },
                                    imageUrl: SPOTIFY_LOGO_URL
                                }
                            ]
                        }
                    }

                    // Broadcast with SDK client function
                    return client.broadcast([textMessage, quickReplyButton]);
                });
            });
        }
    });

    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// Create a server and listen to it.
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});