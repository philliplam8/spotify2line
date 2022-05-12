require('dotenv').config();
const line = require("@line/bot-sdk");
const request = require('request');   // "Request" library
const express = require('express');   // Express web server framework
const cors = require('cors');
const cookieParser = require('cookie-parser');
const generalConfig = require('./configs/general.config.js');
const lineClientConfig = require('./configs/line.config.js'); // TODO will eventually go into Line Service file
const spotifyClientConfig = require('./configs/spotify.config.js'); // TODO will eventually go into Spotify Service file
const helpers = require('./utils/helpers.util.js');
const lineService = require('./services/line.service.js');
const lineMessage = require('./services/lineConstructMessage.service.js');
const spotifyService = require('./services/spotify.service.js');
const cloudinary = require('./services/cloudinary.service.js');

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

// Create a new LINE SDK client.
const client = new line.Client(lineClientConfig);

function callbackSendPreviewTrack(token, trackId, res) {

    var trackOptions = {
        url: 'https://api.spotify.com/v1/tracks/' + trackId,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };

    request.get(trackOptions, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            var previewTrackUrl = body.preview_url;

            if (previewTrackUrl) {
                // Construct LINE audio message type
                const audioMessage = lineMessage.constructAudioMessage(previewTrackUrl);
                return client.broadcast([audioMessage]);
            }
            else {
                const NO_PREVIEW_MESSAGE = lineMessage.NO_PREVIEW_MESSAGE;
                client.broadcast(NO_PREVIEW_MESSAGE);
                res.end();
            }
        }
    })
}

function sendBroadcastMessage(parsedPlaylist, userName, userIcon) {

    const bubbleMessage = lineMessage.constructBubbleMessage(parsedPlaylist, userName, userIcon);
    const NO_PREVIEW_MESSAGE = lineMessage.NO_PREVIEW_MESSAGE;

    // Spotify 30 Second Preview
    let previewTrackUrl = parsedPlaylist.previewUrl;

    // Only send audio message if Spotify has an existing preview Track URL
    if (previewTrackUrl) {

        // Convert mp3 audio to mp4 format using Cloudinary
        cloudinary.uploadAudio(previewTrackUrl, parsedPlaylist.trackTitle).then(function (updatedUrl) {
            const audioMessage = lineMessage.constructAudioMessage(updatedUrl);
            return client.broadcast([bubbleMessage, audioMessage]);
        })

    } else {
        return client.broadcast([bubbleMessage, NO_PREVIEW_MESSAGE]);
    }
}

/********************************************************************
 
 APP ROUTES
 
 *******************************************************************/

// Root Route
app.get('/', (_, res) => {

    res.redirect('/broadcast');

});

app.get('/preview/', async (req, res) => {
    const trackId = req.query.id;

    spotifyService.makePromiseForSpotifyToken().then(function (token) {
        callbackSendPreviewTrack(token, trackId, res);
    });

})

app.get('/check-playlist/', async (req, res) => {
    const playlistId = req.query.id;

    spotifyService.makePromiseForSpotifyToken().then(

        // If promise fulfilled...
        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, playlistId).then(
                function (playlistBody) {
                    res.status(200).send({ playlistId, playlistBody });
                    res.end();
                })
        },

        // If promise rejected...
        function (error) {
            res.send(error);
        }
    )
});

app.get('/playlist', async (_, res) => {

    spotifyService.makePromiseForSpotifyToken().then(

        // If promise fulfilled...
        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, spotifyClientConfig.PLAYLIST).then(
                function (playlistBody) {
                    res.status(200).send({ playlistBody });
                    res.end();
                })
        },

        // If promise rejected...
        function (error) {
            res.send(error);
        }
    )
});

app.get('/check-local-data', async (_, res) => {

    // Get previous value of Total stored
    const storedPlaylistTotalObject = helpers.readStoredTotalValue();

    spotifyService.makePromiseForSpotifyToken().then(
        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, spotifyClientConfig.PLAYLIST).then(
                function (playlistBody) {
                    var spotifyTotal = playlistBody.tracks.total;
                    res.send({ storedPlaylistTotalObject, spotifyTotal });
                    res.end();
                })
        },

        // If promise rejected...
        function (error) {
            res.send(error);
        }
    )
});

app.get('/manual-update-local-data', async (_, res) => {

    // Get previous value of Total stored
    let storedPlaylistTotalObject = helpers.readStoredTotalValue();

    spotifyService.makePromiseForSpotifyToken().then(

        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, spotifyClientConfig.PLAYLIST).then(

                function (playlistBody) {

                    // Parse through response
                    var spotifyTotal = playlistBody.tracks.total;

                    // Update database value to current value
                    helpers.updatedStoredTotalValue(spotifyTotal);
                    storedPlaylistTotalObject = helpers.readStoredTotalValue();
                    res.send({ storedPlaylistTotalObject, spotifyTotal });
                    res.end();
                })
        },
        // If promise rejected...
        function (error) {
            res.send(error);
        }
    )
});

// This route is used to broadcast the latest playlist song to all friends
app.get('/broadcast', async (_, res) => {

    // Get the current time the '/broadcast' route was requested
    var currentTime = new Date();

    // Promise "Consuming Code" (Must wait for a fulfilled Promise...)
    spotifyService.makePromiseForSpotifyToken().then(

        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, spotifyClientConfig.PLAYLIST).then(

                function (playlistBody) {

                    // PARSE THROUGH PLAYLIST API RESPONSE;
                    let parsedPlaylist = spotifyService.parsePlaylistAPI(playlistBody, currentTime);

                    // Get previous value of Total stored
                    const storedPlaylistTotalObject = helpers.readStoredTotalValue();

                    // Spotify's Playlist Tracklist API is pagniated and limited to 100 tracks per page
                    // so we will check if the total tracks to determine where the last track is located
                    if (parsedPlaylist.total > 100) {

                        // Will need to call the Spotify Playlist API again but view the last "page"
                        const offset = helpers.roundToFloorHundreds(parsedPlaylist.total);
                        const alteredPlaylistId = spotifyClientConfig.PLAYLIST + '/tracks?offset=' + offset + '&limit=100';
                        spotifyService.makePromiseForSpotifyPlaylist(token, alteredPlaylistId).then(function (alteredPlaylistBody) {
                            parsedPlaylist = spotifyService.parseAlteredPlaylistAPI(alteredPlaylistBody, currentTime);

                            spotifyService.makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(
                                function (user) {

                                    // Only broadcast if song was added within a minute of ping and new song was added
                                    if (parsedPlaylist.timeDifference <= 1 & storedPlaylistTotalObject != parsedPlaylist.total) {

                                        sendBroadcastMessage(parsedPlaylist, user.userName, user.userIcon);
                                    }
                                });
                        })
                    }

                    else {

                        spotifyService.makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(
                            function (user) {

                                // Only broadcast if song was added within a minute of ping and new song was added
                                if (parsedPlaylist.timeDifference <= 1 & storedPlaylistTotalObject != parsedPlaylist.total) {
                                    sendBroadcastMessage(parsedPlaylist, user.userName, user.userIcon);
                                }
                            });
                    }

                    // Update database value to current value anyways 
                    helpers.updatedStoredTotalValue(parsedPlaylist.total);
                });
        });

    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// Force Broadcast
app.get('/broadcast-override', async (_, res) => {

    // Get the current time the '/broadcast-override' route was requested
    var currentTime = new Date();

    // Promise "Consuming Code" (Must wait for a fulfilled Promise...)
    spotifyService.makePromiseForSpotifyToken().then(

        function (token) {
            spotifyService.makePromiseForSpotifyPlaylist(token, spotifyClientConfig.PLAYLIST).then(
                function (playlistBody) {

                    // PARSE THROUGH PLAYLIST API RESPONSE;
                    let parsedPlaylist = spotifyService.parsePlaylistAPI(playlistBody, currentTime);

                    // Spotify's Playlist Tracklist API is pagniated and limited to 100 tracks per page
                    // so we will check if the total tracks to determine where the last track is located
                    if (parsedPlaylist.total > 100) {

                        // Will need to call the Spotify Playlist API again but view the last "page"
                        const offset = helpers.roundToFloorHundreds(parsedPlaylist.total);
                        const alteredPlaylistId = spotifyClientConfig.PLAYLIST + '/tracks?offset=' + offset + '&limit=100';
                        spotifyService.makePromiseForSpotifyPlaylist(token, alteredPlaylistId).then(

                            function (alteredPlaylistBody) {
                                parsedPlaylist = spotifyService.parseAlteredPlaylistAPI(alteredPlaylistBody, currentTime);
                                spotifyService.makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(
                                    function (user) {
                                        sendBroadcastMessage(parsedPlaylist, user.userName, user.userIcon);
                                    })
                            })
                    }

                    else {
                        spotifyService.makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(
                            function (user) {
                                sendBroadcastMessage(parsedPlaylist, user.userName, user.userIcon);
                            })
                    }

                    // Update database value to current value
                    helpers.updatedStoredTotalValue(parsedPlaylist.total);

                });
        })

    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});

// Create a server and listen to it.
app.listen(generalConfig.PORT, () => {
    console.log(`Application is live and listening on port ${generalConfig.PORT}`);
});