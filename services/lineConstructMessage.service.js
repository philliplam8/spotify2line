const helpers = require('../utils/helpers.util.js');
require('dotenv').config({ path: '../.env' });
const spotifyClientConfig = require('../configs/spotify.config.js');

const SPOTIFY_LOGO_ICON_URL = "https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png";
const SPOTIFY_LOGO_URL = 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png';
const CONY_IMG = "https://static.wikia.nocookie.net/line/images/1/10/2015-cony.png/revision/latest/scale-to-width-down/490?cb=20150806042102";

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
                                    uri: 'https://open.spotify.com/playlist/' + spotifyClientConfig.PLAYLIST
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

module.exports = {
    SPOTIFY_LOGO_ICON_URL,
    SPOTIFY_LOGO_URL,
    CONY_IMG,
    NO_PREVIEW_MESSAGE,
    constructTextMessage,
    constructQuickReplyButtons,
    constructAudioMessage,
    constructBubbleMessage
} 