#Support server

(Discord Vibes)[https://discord.gg/zf46prb]

#Basic Example

```javascript
const Discord = require("discord.js");
const Music = require("discord.js-vibes");

let bot = new Discord.Client();

Music.start(bot, {
    youtubeAPIKey: 'YOUTUBE_API_KEY'
  });

bot.login("BOT_TOKEN");
```

#Full Example
```javascript
const Discord = require("discord.js");
const Music = require("discord.js-vibes");

let bot = new Discord.Client();

Music.start(bot, {
    youtubeAPIKey: 'YOUTUBE_API_KEY'
    prefix: 'BOT_PREFIX' //Default if '!'
    embedColor: 'EMBED_COLOR' //Use a HTML color code
  });

bot.login("BOT_TOKEN");
```