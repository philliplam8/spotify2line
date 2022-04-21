const request = require('request');   // "Request" library
require('dotenv').config({ path: '../.env' });
const spotifyClientConfig = require('../configs/spotify.config.js');
const helpers = require('../utils/helpers.util.js');

// Spotify -- your application requests authorization
var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(spotifyClientConfig.client_id + ':' + spotifyClientConfig.client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

/**
 * 
 * @returns 
 */
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

/**
 * 
 * @param {string} token 
 * @param {string} playlistId 
 * @returns 
 */
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

/**
 * 
 * @param {string} token 
 * @param {string} playlistId 
 * @returns 
 */
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

// Currently unused
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

// Used when >100 songs in the playlist
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


module.exports = {
    makePromiseForSpotifyToken,
    makePromiseForSpotifyPlaylist,
    makePromiseForSpotifyUserName,
    makePromiseForSpotifyTrack,
    parsePlaylistAPI,
    parseAlteredPlaylistAPI
}