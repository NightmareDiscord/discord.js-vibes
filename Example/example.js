const Discord = require("discord.js");
const Music = require("discord.js-vibes");
let bot = new Discord.Client();

Music.start(bot, {
    youtubeAPIKey: 'YOUTUBE_API_KEY'
  });

bot.login("BOT_TOKEN");
