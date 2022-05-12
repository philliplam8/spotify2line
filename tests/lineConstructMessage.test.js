const lineMessage = require('../services/lineConstructMessage.service.js');
const SPOTIFY_LOGO_ICON_URL = "https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png";

test('Create No Preview Message', () => {
    // Test Data
    const td = {
        expectedNoPreviewMessage: {
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
                name: 'Song Preview 🎧',
                iconUrl: SPOTIFY_LOGO_ICON_URL
            }
        },
    }
    expect(lineMessage.NO_PREVIEW_MESSAGE).toEqual(td.expectedNoPreviewMessage);
});

test('Create Audio Message', () => {
    // Test Data
    const td = {
        previewTrack: 'testUrl',
        expectedAudioMessage: {
            type: "audio",
            originalContentUrl: 'testUrl',
            duration: 30000,
            sender: {
                name: 'Song Preview 🎧',
                iconUrl: SPOTIFY_LOGO_ICON_URL
            }
        }
    }
    expect(lineMessage.constructAudioMessage(td.previewTrack)).toEqual(td.expectedAudioMessage);

});