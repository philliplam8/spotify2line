const line = require("@line/bot-sdk");
var request = require('request');   // "Request" library

require('dotenv').config();         // pre-loaded instead using '$ node -r dotenv/config app.js'

const express = require('express');   // Express web server framework
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helpers = require('./utils/helpers.util.js');

// Hosting for Audio files
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup all LINE client configurations.
const clientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET,
};

const PORT = process.env.PORT || 3000;

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

SPOTIFY SECTION

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// SPOTIFY VARIABLES ----------------------------------------------------------
const SPOTIFY_LOGO_ICON_URL = "https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png";
const SPOTIFY_LOGO_URL = 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png';
var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const PLAYLIST = process.env.PLAYLIST_ID;

// LINE Images
const CONY_IMG = "https://static.wikia.nocookie.net/line/images/1/10/2015-cony.png/revision/latest/scale-to-width-down/490?cb=20150806042102";

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

const NO_PREVIEW_MESSAGE = {
    "type": "text",
    "text": "Sorry, a preview does not exist for this song $",
    "emojis": [
        {
            "index": 46,
            "productId": "5ac21c46040ab15980c9b442",
            "emojiId": "003"
        }
    ],
    "sender": {
        name: 'Song Preview 🎧',    // max char limit: 20
        iconUrl: SPOTIFY_LOGO_ICON_URL   // max char limit: 2000 or max size: 1MB
    }
}

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

// ****************************************************************************
// SPOTIFY API DATA MANIPULATION
// ****************************************************************************

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
    var artistSubstring = helpers.shortenToTwentyChar(artist); // used for quick reply

    var totalArtists = lastItem.track.artists.length;

    // For multiple artists
    if (totalArtists >= 2) {

        // If there are only 2 artists
        var firstArtist = artist;
        var secondArtist = lastItem.track.artists[1].name;
        artist = firstArtist + " and " + secondArtist;

        // If there are more than 2 artists
        if (totalArtists > 2) {
            artist = firstArtist;

            for (let i = 1; i < totalArtists; i++) {

                // Last Artist
                if (i == totalArtists - 1) {
                    let lastArtist = lastItem.track.artists[i].name;
                    artist = artist + ", and " + lastArtist;
                    break;
                }

                let nextArtist = lastItem.track.artists[i].name;
                artist = artist + ", " + nextArtist;
            }
        }
    }

    // Album Image
    var testMImageURL = lastItem.track.album.images[0].url;
    var testSImageURL = lastItem.track.album.images[1].url;

    // Links
    // var albumLink = body.external_urls.spotify;
    var songLink = lastItem.track.external_urls.spotify;
    const trackId = songLink.substring(31, 55)
    var artistLink = lastItem.track.artists[0].external_urls.spotify;
    const next = body.tracks.next;
    const previewUrl = lastItem.track.preview_url;

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
        totalArtists: totalArtists,

        // Album Image
        testMImageURL: testMImageURL,
        testSImageURL: testSImageURL,

        // Links
        // albumLink: albumLink,
        songLink: songLink,
        trackId: trackId,
        artistLink: artistLink,
        next: next,
        previewUrl: previewUrl,

        // User
        userId: userId
    };

    return parsedPlaylist;
}

function parseAlteredPlaylistAPI(body, currentTime) {

    // PARSE THROUGH PLAYLIST API RESPONSE;
    var total = body.total;
    var lastItemIndex = body.items.length - 1;
    var lastItem = body.items[lastItemIndex];

    // Time added
    var addedAtTime = lastItem.added_at;
    var timeTZ = new Date(addedAtTime); // Convert to time object
    var timeDifference = (currentTime - timeTZ) / 1000 / 60; // minutes

    // Title
    var trackTitle = lastItem.track.name;

    // Artist
    var artist = lastItem.track.artists[0].name;
    var artistSubstring = helpers.shortenToTwentyChar(artist); // used for quick reply

    var totalArtists = lastItem.track.artists.length;

    // For multiple artists
    if (totalArtists >= 2) {

        // If there are only 2 artists
        var firstArtist = artist;
        var secondArtist = lastItem.track.artists[1].name;
        artist = firstArtist + " and " + secondArtist;

        // If there are more than 2 artists
        if (totalArtists > 2) {
            artist = firstArtist;

            for (let i = 1; i < totalArtists; i++) {

                // Last Artist
                if (i == totalArtists - 1) {
                    let lastArtist = lastItem.track.artists[i].name;
                    artist = artist + ", and " + lastArtist;
                    break;
                }

                let nextArtist = lastItem.track.artists[i].name;
                artist = artist + ", " + nextArtist;
            }
        }
    }

    // Album Image
    var testMImageURL = lastItem.track.album.images[0].url;
    var testSImageURL = lastItem.track.album.images[1].url;

    // Links
    // var albumLink = body.external_urls.spotify;
    var songLink = lastItem.track.external_urls.spotify;
    const trackId = songLink.substring(31, 55)
    var artistLink = lastItem.track.artists[0].external_urls.spotify;
    const next = body.next;
    const previewUrl = lastItem.track.preview_url;

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
        totalArtists: totalArtists,

        // Album Image
        testMImageURL: testMImageURL,
        testSImageURL: testSImageURL,

        // Links
        // albumLink: albumLink,
        songLink: songLink,
        trackId: trackId,
        artistLink: artistLink,
        next: next,
        previewUrl: previewUrl,

        // User
        userId: userId
    };

    return parsedPlaylist;
}

// ****************************************************************************
// Cloudinary - File Hosting
// ****************************************************************************

// file = local file or url
// publicId = choose the publicId value i.e. name in cloudinary's storage
function cloudinaryUploadAudio(file, publicId) {

    return new Promise(function (resolve, reject) {

        cloudinary.v2.uploader.upload(file,
            {
                public_id: publicId,
                resource_type: 'video',
                format: 'mp4'
            },
            function (err, res) {
                if (err) return reject(err);

                const songLink = String(res.secure_url);
                console.log(typeof (songLink), songLink);
                return resolve(songLink);
            });
    })
}

function cloudinaryDeleteAudio(publicId) {
    cloudinary.v2.uploader.destroy(publicId,
        { invalidate: true, resource_type: "video" },
        function (err, res) {
            console.log(res);
        }
    );
}

// Check hourly usage limits (free tier = 500 per hour, and refreshes)
cloudinary.v2.api.resources(
    function (error, result) {
        console.log(result.rate_limit_allowed,
            result.rate_limit_remaining,
            result.rate_limit_reset_at);
    });

// ****************************************************************************
// CONSTRUCT LINE MESSAGE TYPES
// ****************************************************************************
function constructTextMessage(parsedPlaylist, userName) {

    let trackTitle = parsedPlaylist.trackTitle;
    let artist = parsedPlaylist.artist;
    let total = parsedPlaylist.total;

    // Compose message with Template Literals (Template Strings)
    // const DATA = `I added the song "${trackTitle}" by ${artit}.\n\nThere are now ${total} songs in the playlist.`;
    const DATA = `"${trackTitle}" by ${artist}`;

    // Create a new message.
    const textMessage = {
        type: 'text',
        text: DATA,
        sender: {
            name: helpers.shortenToTwentyChar(userName), // Sender will appear in the notification push and in the convo
            iconUrl: CONY_IMG
        }
    };

    return textMessage;
}

function constructQuickReplyButtons(parsedPlaylist, userName) {

    let testMImageURL = parsedPlaylist.testMImageURL;
    let testSImageURL = parsedPlaylist.testSImageURL;
    let songLink = parsedPlaylist.songLink;
    let artistSubstring = parsedPlaylist.artistSubstring;
    let artistLink = parsedPlaylist.artistLink;
    let albumLink = parsedPlaylist.albumLink;

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
                    imageUrl: SPOTIFY_LOGO_ICON_URL
                },
                {
                    // Quick reply to view playlist in Spotify
                    type: "action",
                    action: {
                        type: "uri",
                        label: "Open Playlist 📃",
                        uri: albumLink
                    },
                    imageUrl: SPOTIFY_LOGO_ICON_URL
                }
            ]
        },
        sender: {
            name: helpers.shortenToTwentyChar(userName),
            iconUrl: CONY_IMG
        }
    }

    return quickReplyButton;
}

function constructAudioMessage(previewTrackUrl) {

    const audioMessage = {
        type: "audio",
        originalContentUrl: previewTrackUrl,
        duration: 30000,
        sender: {
            name: 'Song Preview 🎧',    // max char limit: 20
            iconUrl: SPOTIFY_LOGO_ICON_URL   // max char limit: 2000 or max size: 1MB
        }
    }

    return audioMessage;

}

function constructBubbleMessage(parsedPlaylist, userName) {

    const bubbleMessage = {
        type: 'flex',
        altText: "A new song has been added",
        contents: {
            type: 'bubble',
            size: 'giga',
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'none',
                contents: [
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'image',
                                url: SPOTIFY_LOGO_URL,
                            }
                        ],
                        height: '70px',
                        position: 'relative',
                        offsetBottom: '20px'
                    },
                    {
                        type: 'image',
                        url: parsedPlaylist.testMImageURL,
                        size: '1000px',
                        action: {
                            type: 'uri',
                            uri: parsedPlaylist.testMImageURL + '?_ignored='
                        },
                    },
                    {
                        type: 'text',
                        text: '\n' + parsedPlaylist.trackTitle,
                        size: 'lg',
                        wrap: true,
                        align: 'center',
                        gravity: 'bottom'
                    },
                    {
                        type: 'text',
                        text: 'by ' + parsedPlaylist.artist + '\n',
                        size: 'sm',
                        wrap: true,
                        align: 'center',
                        gravity: 'top'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'box',
                                layout: 'horizontal',
                                spacing: 'md',
                                contents: [
                                    {
                                        type: 'button',
                                        style: 'primary',
                                        action: {
                                            type: 'uri',
                                            label: 'Check out song! 🎵',
                                            uri: parsedPlaylist.songLink
                                        },
                                    },
                                    {
                                        type: 'button',
                                        style: 'primary',
                                        action: {
                                            type: 'uri',
                                            label: parsedPlaylist.artistSubstring,
                                            uri: parsedPlaylist.artistLink
                                        },
                                        adjustMode: 'shrink-to-fit'
                                    }
                                ],
                                paddingAll: '10px'
                            },
                            {
                                type: 'button',
                                style: 'link',
                                action: {
                                    type: 'uri',
                                    label: 'Open Playlist 📃',
                                    uri: 'https://open.spotify.com/playlist/' + PLAYLIST
                                }
                            }]
                    }],
                paddingAll: '10px'
            }
        },
        sender: {
            name: helpers.shortenToTwentyChar(userName),
            iconUrl: CONY_IMG
        }
    }

    console.log(userName)
    return bubbleMessage;
}

function makePromiseForSpotifyToken() {

    return new Promise(function (resolve, reject) {

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var token = body.access_token;
                resolve(token);
            }

            reject(error);
        })
    });
}

function makePromiseForSpotifyPlaylist(token, playlistId) {

    let playlistOptions = {
        url: 'https://api.spotify.com/v1/playlists/' + playlistId,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };

    return new Promise(function (resolve, reject) {

        request.get(playlistOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(body);
            }
            reject(error);

        })
    });
}

function makePromiseForSpotifyUserName(token, userId) {

    // Determine userName from userId:
    var userIdOptions = {
        url: 'https://api.spotify.com/v1/users/' + userId,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };

    return new Promise(function (resolve, reject) {
        request.get(userIdOptions, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body.display_name);
            }
            reject(error);
        });
    });
}

function makePromiseForSpotifyTrack(token, trackId) {

    var trackOptions = {
        url: 'https://api.spotify.com/v1/tracks/' + trackId,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };

    return new Promise(function (resolve, reject) {
        request.get(trackOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var previewTrackUrl = body.preview_url;

                resolve(previewTrackUrl);
            }
            reject(error);
        });
    })
}

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
                const audioMessage = constructAudioMessage(previewTrackUrl);
                return client.broadcast([audioMessage]);
            }
            else {
                client.broadcast(NO_PREVIEW_MESSAGE);
                res.end();
            }
        }
    })
}

function sendBroadcastMessage(token, parsedPlaylist, userName) {

    const bubbleMessage = constructBubbleMessage(parsedPlaylist, userName);

    // Spotify 30 Second Preview
    let previewTrackUrl = parsedPlaylist.previewUrl;

    // Only send audio message if Spotify has an existing preview Track URL
    if (previewTrackUrl) {

        cloudinaryUploadAudio(previewTrackUrl, parsedPlaylist.trackTitle).then(function (updatedUrl) {
            const audioMessage = constructAudioMessage(updatedUrl);
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

    makePromiseForSpotifyToken().then(function (token) {
        callbackSendPreviewTrack(token, trackId, res);
    });

})

app.get('/check-playlist/', async (req, res) => {
    const playlistId = req.query.id;

    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, playlistId).then(function (playlistBody) {
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

    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, PLAYLIST).then(function (playlistBody) {
            res.status(200).send({ PLAYLIST, playlistBody });
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

    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, PLAYLIST).then(function (playlistBody) {
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

    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, PLAYLIST).then(function (playlistBody) {

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
    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, PLAYLIST).then(function (playlistBody) {

            // PARSE THROUGH PLAYLIST API RESPONSE;
            let parsedPlaylist = parsePlaylistAPI(playlistBody, currentTime);

            // Get previous value of Total stored
            const storedPlaylistTotalObject = helpers.readStoredTotalValue();

            // Spotify's Playlist Tracklist API is pagniated and limited to 100 tracks per page
            // so we will check if the total tracks to determine where the last track is located
            if (parsedPlaylist.total > 100) {

                // Will need to call the Spotify Playlist API again but view the last "page"
                const offset = 100 * Math.floor(parsedPlaylist.total / 100);
                const alteredPlaylistId = PLAYLIST + '/tracks?offset=' + offset + '&limit=100';
                makePromiseForSpotifyPlaylist(token, alteredPlaylistId).then(function (alteredPlaylistBody) {
                    parsedPlaylist = parseAlteredPlaylistAPI(alteredPlaylistBody, currentTime);

                    makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(function (userName) {

                        // Only broadcast if song was added within a minute of ping and new song was added
                        if (parsedPlaylist.timeDifference <= 1 & storedPlaylistTotalObject != parsedPlaylist.total) {

                            sendBroadcastMessage(token, parsedPlaylist, userName);
                        }
                    });
                })
            }

            else {

                makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(function (userName) {

                    // Only broadcast if song was added within a minute of ping and new song was added
                    if (parsedPlaylist.timeDifference <= 1 & storedPlaylistTotalObject != parsedPlaylist.total) {
                        sendBroadcastMessage(token, parsedPlaylist, userName);
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

    // Get the current time the '/broadcast' route was requested
    var currentTime = new Date();

    // Promise "Consuming Code" (Must wait for a fulfilled Promise...)
    makePromiseForSpotifyToken().then(function (token) {
        makePromiseForSpotifyPlaylist(token, PLAYLIST).then(function (playlistBody) {

            // PARSE THROUGH PLAYLIST API RESPONSE;
            let parsedPlaylist = parsePlaylistAPI(playlistBody, currentTime);

            // Spotify's Playlist Tracklist API is pagniated and limited to 100 tracks per page
            // so we will check if the total tracks to determine where the last track is located
            if (parsedPlaylist.total > 100) {

                // Will need to call the Spotify Playlist API again but view the last "page"
                const offset = 100 * Math.floor(parsedPlaylist.total / 100);
                const alteredPlaylistId = PLAYLIST + '/tracks?offset=' + offset + '&limit=100';
                makePromiseForSpotifyPlaylist(token, alteredPlaylistId).then(function (alteredPlaylistBody) {
                    parsedPlaylist = parseAlteredPlaylistAPI(alteredPlaylistBody, currentTime);

                    makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(function (userName) {

                        sendBroadcastMessage(token, parsedPlaylist, userName);

                    })
                })
            }

            else {
                makePromiseForSpotifyUserName(token, parsedPlaylist.userId).then(function (userName) {
                    sendBroadcastMessage(token, parsedPlaylist, userName);
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
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});

