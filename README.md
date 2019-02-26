__Support server__

[Discord Vibes](https://discord.gg/zf46prb)

__Warning__
If your having problems installing the module, install [node-gyp](https://www.npmjs.com/package/node-gyp) because the module now uses node-opus for better music quality that requires node-gyp to install.

__Commands__

play {Search String} or {Playlist link} | Plays the song selected.

pause | Pauses the playing song.

resume | Resumes the paused song.

leave | Leaves the channel the bot is on.

skip | Skips the playing song.

queue | Shows you all songs in the queue.

repeat | Enables or disables song repeat.

volume {Number || current} | Shows you the current volume or changes the volume depending on what you type.

__Basic Example__

```javascript
const Discord = require("discord.js");
const Music = require("discord.js-vibes");

let bot = new Discord.Client();

Music.start(bot, {
    youtubeAPIKey: 'YOUTUBE_API_KEY'
  });

bot.login("BOT_TOKEN");
```

__Full Example__

```javascript
const Discord = require("discord.js");
const Music = require("discord.js-vibes");

let bot = new Discord.Client();

Music.start(bot, {
    youtubeAPIKey: 'YOUTUBE_API_KEY',
    botPrefix: 'BOT_PREFIX', //Default if '!'
    embedColor: 'EMBED_COLOR', //Use a HTML color code
    maxVolume: 200, //Default 200 
    botLogging: true, //Set this to false if you don't want console logging.
  });

bot.login("BOT_TOKEN");
```
