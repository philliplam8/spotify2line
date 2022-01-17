"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

// Import all dependencies, mostly using destructuring for better view.
const line = require("@line/bot-sdk");
var request = require('request'); // "Request" library

const fs = require('fs'); // fs Module to read/write JSON files
require('dotenv').config()  // pre-loaded instead using '$ node -r dotenv/config app.js'

var express = require('express'); // Express web server framework
var cors = require('cors');
var cookieParser = require('cookie-parser');
const res = require("express/lib/response");
const { redirect, type } = require("express/lib/response");
const e = require("express");
const { time } = require("console");

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
const client = new line.Client(clientConfig);

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

function parsePlaylistAPI(body, currentTime) {

    // PARSE THROUGH PLAYLIST API RESPONSE;
    var total = body.tracks.total;
    var lastItemIndex = body.tracks.items.length - 1;
    var lastItem = body.tracks.items[lastItemIndex];

    // Time added
    var addedAtTime = lastItem.added_at;
    var timeTZ = new Date(addedAtTime); // Convert to time object
    var timeDifference = (currentTime - timeTZ) / 1000 / 60; // minutes

    // Title
    var trackTitle = lastItem.track.name;

    // Artist
    var artist = lastItem.track.artists[0].name;
    var artistSubstring = shortenArtistName(artist);

    // Album Image
    var testMImageURL = lastItem.track.album.images[0].url;
    var testSImageURL = lastItem.track.album.images[1].url;

    // Links
    var albumLink = body.external_urls.spotify;
    var songLink = lastItem.track.external_urls.spotify;
    var artistLink = lastItem.track.artists[0].external_urls.spotify;

    // User
    var userId = lastItem.added_by.id;

    // Return data as a object literal
    var parsedPlaylist = {
        total: total,
        lastItemIndex: lastItemIndex,
        lastItem: lastItem,

        // Time added
        addedAtTime: addedAtTime,
        timeDifference: timeDifference,

        // Title
        trackTitle: trackTitle,

        // Artist
        artist: artist,
        artistSubstring: artistSubstring,

        // Album Image
        testMImageURL: testMImageURL,
        testSImageURL: testSImageURL,

        // Links
        albumLink: albumLink,
        songLink: songLink,
        artistLink: artistLink,

        // User
        userId: userId
    };

    return parsedPlaylist;
}

function readStoredTotalValue(file) {
    let rawdata = fs.readFileSync(file);
    return JSON.parse(rawdata);
}

function constructTextMessage(trackTitle, artist, addedAtTime, total, timeDifference, userName) {

    // Compose message with Template Literals (Template Strings)
    const DATA = `I just added the song "${trackTitle}" by ${artist} at ${addedAtTime}.\n\nThere are now ${total} songs in the playlist. Time Difference = ${timeDifference}`;

    // Create a new message.
    const textMessage = {
        type: 'text',
        text: DATA,
        sender: {
            name: userName, // Sender will appear in the notification push and in the convo
            iconUrl: "https://static.wikia.nocookie.net/line/images/1/10/2015-cony.png/revision/latest/scale-to-width-down/490?cb=20150806042102"
        }
    };

    return textMessage;
}

function constructQuickReplyButtons(testMImageURL, testSImageURL, songLink, artistSubstring, artistLink, albumLink) {

    // Create a quick reply button (Note: only works on mobile and label allows max 20 char)
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

    return quickReplyButton;
}


/********************************************************************

 APP ROUTES

 *******************************************************************/

// Root Route
app.get('/', async (_, res) => {

    // Initiate an update on startup so that route '/ping/' will not broadcast
    // (in case FreshPing/Heroku restarts)
    res.redirect('/manual-update-local-data');

});

// This route is used for the Webhook.
// The purpose of middleware is to... 
//       1) validate the request is from an offical LINE server (not fraud)
//       2) parse the webhook event object
app.post('/webhook', line.middleware(middlewareConfig), async (req, res) => {
    const events = req.body.events; // webhook event objects
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

// METHOD 2: ----------------------------------------------------------------- I THINK I DID IT.
app.get('/check-local-data-two', async (_, res) => {

    // Get local database value
    let data = fs.readFileSync('total.json');
    let storedPlaylistTotalObject = JSON.parse(data);

    // Create promise to grab Spotify access token
    let mySpotifyTokenPromise = new Promise(function (myResolve, myReject) {

        // Promise "Producing Code" (May take some time)
        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var token = body.access_token;
            };
            myResolve(token); // if successful
            myReject(error);  // if error
        })
    });

    // Promise "Consuming Code" (Must wait for a fulfilled Promise...
    mySpotifyTokenPromise.then(

        // If promise fulfilled...
        function (token) {

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

                    res.send({ storedPlaylistTotalObject, spotifyTotal });
                    res.end();
                }
            });
        },

        // If promise rejected...
        function (error) {
            res.send(error);
        }
    )
});

app.get('/manual-update-local-data', async (_, res) => {

    // Get local database value
    let data = fs.readFileSync('total.json');
    let storedPlaylistTotalObject = JSON.parse(data);

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
                    storedPlaylistTotalObject.total = spotifyTotal;
                    fs.writeFileSync('total.json', JSON.stringify(storedPlaylistTotalObject));

                    res.send({ storedPlaylistTotalObject, spotifyTotal });
                    res.end();
                }
            });
        };
    });
});

// This route is used to broadcast the latest playlist song to all friends
// TODO fix the callback hell below
app.get('/broadcast', async (_, res) => {

    // Get the current time the '/broadcast' route was requested
    var currentTime = new Date();

    // Create promise to grab Spotify access token
    let mySpotifyTokenPromise = new Promise(function (myResolve, myReject) {

        // Promise "Producing Code" (May take some time)
        request.post(authOptions, function (error, response, body) {

            // use the access token to access the Spotify Web API
            var token = body.access_token;

            myResolve(token); // if successful
            myReject(error);  // if error

        });
    });

    // Promise "Consuming Code" (Must wait for a fulfilled Promise...)
    mySpotifyTokenPromise.then(function (token) {

        var playlistOptions = {
            url: 'https://api.spotify.com/v1/playlists/' + PLAYLIST,
            headers: {
                'Authorization': 'Bearer ' + token
            },
            json: true
        };

        request.get(playlistOptions, function (error, response, body) {

            // PARSE THROUGH PLAYLIST API RESPONSE;
            var parsedPlaylist = parsePlaylistAPI(body, currentTime);

            // Determine userName from userId:
            var userIdOptions = {
                url: 'https://api.spotify.com/v1/users/' + parsedPlaylist.userId,
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };

            // Grab userName from userId using Spotify Users API
            request.get(userIdOptions, function (error, response, body) {

                // Parse through response
                var userName = body.display_name;

                // Get previous value of Total stored
                var jsonFile = 'total.json';
                let storedPlaylistTotalObject = readStoredTotalValue(jsonFile);

                // Only broadcast if song was added within a minute of ping and new song was added
                if (parsedPlaylist.timeDifference <= 1 & storedPlaylistTotalObject.total != parsedPlaylist.total) {

                    // Update database value to current value
                    storedPlaylistTotalObject.total = parsedPlaylist.total;
                    fs.writeFileSync(jsonFile, JSON.stringify(storedPlaylistTotalObject));

                    // Construct messages
                    const textMessage = constructTextMessage(
                        parsedPlaylist.trackTitle,
                        parsedPlaylist.artist,
                        parsedPlaylist.addedAtTime,
                        parsedPlaylist.total,
                        parsedPlaylist.timeDifference,
                        userName);

                    const quickReplyButton = constructQuickReplyButtons(
                        parsedPlaylist.testMImageURL,
                        parsedPlaylist.testSImageURL,
                        parsedPlaylist.songLink,
                        parsedPlaylist.artistSubstring,
                        parsedPlaylist.artistLink,
                        parsedPlaylist.albumLink);

                    // Broadcast with SDK client function
                    return client.broadcast([textMessage, quickReplyButton]);
                }



                res.end();
            });
        });
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