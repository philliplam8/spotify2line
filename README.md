# spotify2line

Currently, Spotify has implemented collaborative playlists, which allow multiple users to add songs to a single shared playlist. However, there is no existing notification system in place when someone adds a song. The motivation to create spotify2line was to solve this problem and create a way to send notification updates to a LINE chat when a new song has been added.

spotify2line is a Line bot channel that will send updates when a new song is added into a collaborative playlist.

## Screenshot
![spotify2line demo screenshot](https://github.com/philliplam8/spotify2line/blob/main/assets/spotify2line-demo-screenshot.png)

## Installation
Use the package manager [npm](https://www.npmjs.com/) to install 

```console
npm install @line/bot-sdk express cors cookie-parser request fs dotenv
```

## Usage
This project will use the following free services to host and run the spotify2line application
- [Heroku](https://www.heroku.com/)
- [FreshPing](https://app.freshping.io/)


## License
spotify2line is licensed under the [MIT license](https://github.com/philliplam8/spotify2line/blob/main/LICENSE.txt)
