# spotify2line

Currently, Spotify has implemented collaborative playlists, which allow multiple users to add songs to a single shared playlist. However, there is no existing notification system in place when someone adds a song. The motivation to create spotify2line was to solve this problem and create a way to send notification updates to a LINE chat when a new song has been added.

spotify2line is a Line bot channel that will send updates when a new song is added into a collaborative playlist.

## Screenshot
![spotify2line demo screenshot](./assets/spotify2line-demo-screenshot.png)

## Getting Started

### Pre-requisites
- [x] Spotify account 
- [x] LINE account

### Installation
Ideally, this application is hosted on a cloud platform (Ex: Heroku). 

1. Clone this project
    ```console
    git clone https://github.com/philliplam8/spotify2line.git
    ```
2. Use the package manager [npm](https://www.npmjs.com/) to install the following dependencies
    ```console
    npm install @line/bot-sdk express cors cookie-parser request fs dotenv
    ```
3. Follow steps 1-4 in the [Usage](#Usage) section below to setup the Spotify/Line APIs

### Usage
This project will use the following APIs and free services to run and host the spotify2line application
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/reference/#/)
- [LINE Messaging API](https://developers.line.biz/en/services/messaging-api/)
- [Heroku](https://www.heroku.com/)
- [FreshPing](https://app.freshping.io/)

#### 1. Environment Variables File
1. A sample environments variable file `.env` has already been created in the root directory of the project
2. In the following next steps, we will be adding several environment variables into this file

#### 2. Create a new Spotify Developer App and Generate Client ID & Client Secret
1. Log into [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) with your existing Spotify account
2. Click *Create An App*
3. Fill in all required details and create a new Spotify Developer App
4. Copy the *Client ID* and *Client Secret* from the Dashboard Overview page and paste into the `.env` file

#### 3. Determine Spotify Playlist ID
1. Open your desired Spotify Playlist
2. Right-click on the playlist
3. Click `Share > Copy link to playlist`
4. Paste the share link into any text editor
5. The share link will appear with the following syntax `https://open.spotify.com/playlist/{playlistId}?si=`
6. Copy the `playlistId` value and paste it into the `.env` file 

#### 4. Create a new LINE Channel and Generate Channel Access Token & Channel Secret
1. Visit the [LINE Developers Messaging API](https://developers.line.biz/en/services/messaging-api/) page 
2. Click *Start now*
3. Login with your existing LINE account
4. Create a new channel
5. Copy the *Channel Secret* and *Channel Acccess Token* from the Dashboard Overview page and paste into the `.env` file

#### 5. Create a new Heroku app and deploy app
> _Heroku is used here, but feel free to use any hosting method (local, AWS, etc.)_
1. Visit [Heroku](https://id.heroku.com/login) and create a new account (or sign in with an existing account)
2. Click *New > Create new app*
3. Following the instructions to *Deploy using Heroku Git*
4. Visit the *Settings Tab*
5. Click on *Reveal Config Vars*
6. Copy and paste all key/values from the `.env` file into the Heroku Config Vars section
7. Click on *More > View Logs* and ensure the app has been deployed successfully


#### 6. Setup FreshPing to periodically ping Heroku app
1. Visit [Freshping](https://app.freshping.io/) and create a new account (or sign in with an existing account)
2. Click *+ Add Check*
3. Enter the Heroku app URL into the *Check URL* field
4. Set *Check interval = 1 min*
5. Click *Save*


## License
spotify2line is licensed under the [MIT license](https://github.com/philliplam8/spotify2line/blob/main/LICENSE.txt)