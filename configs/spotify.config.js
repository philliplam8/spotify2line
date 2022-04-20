require('dotenv').config({ path: '../.env' });

// Setup all Spotify client configurations.
const spotifyClientConfig = {
    client_id: process.env.SPOTIFY_CLIENT_ID, // Your client id
    client_secret: process.env.SPOTIFY_CLIENT_SECRET, // Your secret
    PLAYLIST: process.env.PLAYLIST_ID,
};

module.exports = spotifyClientConfig;