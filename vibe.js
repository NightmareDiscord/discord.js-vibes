/*
MIT License

Copyright (c) 2019 Oliver James Kennewell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

//Constants
const Discord = require("discord.js");
const search = require("youtube-search");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const PACKAGE = require("./package.json");

//Variables
let queue = {};

/*

 * @param {Client} bot - The discord.js client.

 * @param {object} options - Options to configure the client bot.

*/

//Start the module
exports.start = (bot, options) => {

    //Music class
    class Music {

        //Options
        constructor (bot, options) {

            this.youtubeAPIKey = (options && options.youtubeAPIKey);

            this.botPrefix = (options && options.botPrefix) || "!";
            
            this.embedColor = (options && options.embedColor) || "#287aff";

            this.maxVolume = parseInt((options && options.maxVolume) || 200);

            this.botLogging = (options && typeof options.botLogging !== 'undefined' ? options && options.botLogging : true);
        
            this.largeImage = (options && typeof options.largeImage !== 'undefined' ? options && options.largeImage : false)  

        }

    }

    //Export music class
    let music = new Music(bot, options);
    exports.bot = music;

    //Ready event
    bot.on("ready", () => {

        //If bot logging is true 
        if(music.botLogging === true) {

            //Log infomation
            console.log(`[MUSIC] Music initialized.`);


        }

    });

    //Message event
    bot.on("message", async message => {

        //Variables
        let args = message.content.slice(music.botPrefix.length).trim().split(/ +/g);
        let cmd = args.shift().toLowerCase();

      //If there isn't a queue already
      if (!queue[message.guild.id]) queue[message.guild.id] = {
        queue: [],
        songNames: [],
        songRequesters: [],
        loop: false,
        volume: 0
      };

        //If the message doesn't start with the prefix
        if(!message.content.startsWith(music.botPrefix)) return;

        //If the author is a bot
        if(message.author.bot) return;
        
        //Commands
        if(cmd === "play") {
            playCMD(message, args)
          }
 
          if(cmd === "pause") {
           pauseCMD(message, args)
         }
 
         if(cmd === "resume") {
           resumeCMD(message, args);
         }
 
         if(cmd === "leave") {
           leaveCMD(message, args);
         }
 
         if(cmd === "skip") {
           skipCMD(message, args);
         }
 
         if(cmd === "queue") {
           queueCMD(message, args);
         }
 
         if(cmd === "repeat") {
           repeatCMD(message, args);
         }
 
         if(cmd === "volume") {
           volumeCMD(message, args);
         }
 
    });

    //Dispatcher function
    async function dispatcher(connection, message) {

        //Get the server
        let server = queue [message.guild.id];

        //Start the queue
        server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: "audioonly"}));

        //Set the volume
        server.dispatcher.setVolume(parseInt(100 / 100));
        server.volume=100;

        //End event
        server.dispatcher.on("end", async function() {

            //If the repeat is disabled
            if(server.loop === false) {

              //Return the arrays
              await server.queue.shift();
              await server.songNames.shift();
              await server.songRequesters.shift();

            };

            //If theres another song
            if(server.queue[0]) {

              //Repeat the function
              dispatcher(connection, message);

              //If repeat is enabled
              if(server.loop === true) return;

              //Get the ID of the video
              let id = await ytdl.getVideoID(server.queue[0]);

              //Send the now playing
              let nowPlaying = new Discord.RichEmbed()
              .setColor(music.embedColor)
              .setTitle(`**Now Playing**: ${server.songNames[0]}`)
              .setURL(server.queue[0])
              .addField("Requester:", server.songRequesters[0], true)
              .addField("Volume:", server.volume, true)
              if(music.largeImage === true) nowPlaying.setImage(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
              if(music.largeImage === false) nowPlaying.setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
              message.channel.send(nowPlaying);

            }

            //If there is no songs left
            if(!server.queue[0]) {

              //Leave the channel
              message.guild.me.voiceChannel.leave();

              //Send the message
              message.channel.send("🎵 | Playback finished.");

            }

        });

    }

    async function playCMD(message, args) {

      //If the user is not in a voice channel
      if(!message.member.voiceChannel) return message.channel.send("⛔ | You need to be in a voice channel to use this command.");

      //If the songs name isn't specified
      if(!args.join(" ")) return message.channel.send("⛔ | Please specify what song you want playing.");

      //If a URL is given
      let string = args.join(" ");

      //Check for '&' and split them
      if(string.includes("https://youtu.be/") || string.includes("https://www.youtube.com/") && string.includes("&")) string = string.split("&")[1];

      //If it's a playlist link
      if(string.includes("list=")) {

          //Get the playlist ID
          let playlistID = string.toString().split("list=")[1];

          //If the playlist ID includes a '?'
          if(playlistID.includes("?")) playlistID = playlistID.split("?")[0];
        
          //If the playlist ID includes a '&t='
          if(playlistID.includes("&t=")) playlistID = playlistID.split("&t=")[0];

          //Get the playlist items
          ytpl(playlistID, async function(err, playlist) {

            //If there is an error
            if(err) message.channel.send("⛔ | Somthing went wrong getting that playlist.");

            //Get the server queue
            let server = queue[message.guild.id];

            //Push the information to the arrays
            playlist.items.forEach((song) => {

              //Push to the arrays
              server.queue.push(song.url_simple);
              server.songNames.push(song.title);
              server.songRequesters.push(message.author.tag);

            });

            //If the bot isn't playing in a channel
            if(!message.guild.voiceConnection) await message.member.voiceChannel.join().then(function(connection) {
               
              //Run the dispatcher function
               dispatcher(connection, message);

            });

          //Send the added to queue
          let addedToQueue = new Discord.RichEmbed()
            .setColor(music.embedColor)
            .setTitle(`**Added to queue**: ${playlist.title}`)
            .setURL(playlist.url)
            .addField("Requester:", message.author.tag, true)
            if(music.largeImage === true) addedToQueue.setImage(playlist.items[0].thumbnail);
            if(music.largeImage === false) addedToQueue.setThumbnail(playlist.items[0].thumbnail);
          message.channel.send(addedToQueue);



          });

      }

      //If it isn't a playlist

      //Get the search options
      var opts = {
        maxResults: 1,
        key: music.youtubeAPIKey
      };

      search(args.join(" "), opts, async function(err, results) {
        
        //If there's an error
        if(err) return message.channel.send("⛔ | Something went wrong getting that song.");

        //Server
        let server = queue[message.guild.id];
       
        //Push to the arrays
        server.queue.push(results[0].link);
        server.songNames.push(results[0].title);
        server.songRequesters.push(message.author.tag);

        //Get the video ID
        let id = ytdl.getVideoID(results[0].link);

        //Send the added to queue
        let addedToQueue = new Discord.RichEmbed()
        .setColor(music.embedColor)
        .setTitle(`**Added to queue**: ${results[0].title}`)
        .setURL(results[0].link)
        .addField("Requester:", message.author.tag, true)
        if(music.largeImage === true) addedToQueue.setImage(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
        if(music.largeImage === false) addedToQueue.setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
        message.channel.send(addedToQueue);

        //If the bot isn't playing in a channel
        if(!message.guild.voiceConnection) await message.member.voiceChannel.join().then(function(connection) {
               
          //Run the dispatcher function
            dispatcher(connection, message);
        
        });
        
      });
      
    }

    async function pauseCMD(message, args) {

      //Get the queue
      let server = queue[message.guild.id];

      //Check if there is anything playing
      if(!server.queue[0]) return message.channel.send("⛔ | There is nothing to pause at this moment.");

      //Pause the song
      server.dispatcher.pause();

      //Send the confirmation
      message.channel.send("⏸ | Paused.");

    }

    async function resumeCMD(message, args) {

      //Get the queue
      let server = queue[message.guild.id];

      //If there is nothing in the queue 
      if(server.dispatcher.paused === false) return message.channel.send("⛔ | There is nothing to resume at this moment.");

      //Resume the song
      server.dispatcher.resume();

      //Send the confirmation
      message.channel.send("▶ | Resumed.");

    }

    async function leaveCMD(message, args) {

      //Check if the bot is in a voice channel
      if(!message.guild.me.voiceChannel) return message.channel.send("⛔ | Sorry. I'm not in a Voice Channel.");

      //Check if the member is in the bots voice channel
      if(message.member.voiceChannel !== message.guild.me.voiceChannel) return message.channel.send("❌ | Please join my Voice Channel.");

      //Get the server
      let server = queue[message.guild.id];

      //Clear the queue
      server.queue = []

      //Leave the voice channel
      message.guild.me.voiceChannel.leave();
      
      message.channel.send("💨 | Success. I have left the Voice Channel.");
    }

    async function skipCMD(message, args) {

      //Get the server
      let server = queue[message.guild.id];

      //Check if there is a queue
      if(!server.queue[0]) return message.channel.send("⛔ | Sorry. Nothing is playing at the moment.");

      //Turn loop off
      server.loop=false

      //Pause
       server.dispatcher.end();

      message.channel.send("⏩ | Success. I have Skipped the current song");
    }


    async function queueCMD(message, args) {

              //Get the server
              let server = queue[message.guild.id];

              //Check if there is a queue
              if(server.queue[0] === null) return message.channel.send("⛔ | Sorry. There is nothing in the queue.");

              //JavaScript arrays
              let names = [];

              //Push the song names
              server.songNames.forEach((song) => {

                //Push to Names array
                names.push(song);
                
              });

              //If the queue is bigger than 10
              if(names.length > 10) {

                //Send the embed
                let embed = new Discord.RichEmbed()
                .setColor(music.embedColor)
                .setTitle("Queue for: ", message.guild.name)
                .setThumbnail(message.guild.iconURL)
                .setDescription(`**The queue is long only next 10 shown**\n\n1. ${names[0]}\n2. ${names[1]}\n3. ${names[2]}\n4. ${names[3]}\n5. ${names[4]}\n6. ${names[5]}\n7. ${names[6]}\n8. ${names[7]}\n9. ${names[8]}\n10. ${names[9]}`)
                message.channel.send(embed);
                
                //Stop other code from running
                return;

              }

              //If the queue is 10 or under
              let embed = new Discord.RichEmbed()
              .setColor(music.embedColor)
              .setTitle("Queue for: ", message.guild.name)
              .setThumbnail(message.guild.iconURL)
              .setDescription(`${names.slice(0,15).join('\n')}`)
              message.channel.send(embed);
              
    }

    async function repeatCMD(message, args) {

      //Get the servers queue
      let server = queue[message.guild.id];

      //Check if there is a queue
      if(server.queue[0] === null) return message.channel.send("⛔ | Sorry. There is nothing in the queue.");

      if(server.loop === false) {

        //Enable the loop
        server.loop=true

        message.channel.send("🔂 | Success. Repeat is now **enabled**.");

      } else if(server.loop === true) {

        //Disable
        server.loop=false

        message.channel.send("🔁 | Success. Repeat is now **disabled**.");

      }
    }

    async function volumeCMD(message, args) {

          //Get the servers queue
          let server = queue[message.guild.id];

          if(!server.queue[0]) return message.channel.send("⛔ | Sorry. Nothing is playing at the moment.");

          //Check if a volume is specified
          if(!args[0]) return message.channel.send(`⛔ | Sorry. Please specify a volume between 1 - ${music.maxVolume} or use **${music.botPrefix}volume current** for the current volume.`);

          let opt = args[0].toLowerCase();
          if(opt === "current") {

            let embed = new Discord.RichEmbed()
            .setColor(music.embedColor)
            .setTitle("Current Volume")
            .setThumbnail(message.guild.iconURL)
            .setDescription("**Current Volume**: " + server.volume)
            message.channel.send(embed);

          return;
          } else {

          //Check if the Volume mentions is a number
          if(isNaN(args[0])) return message.channel.send("⛔ | Sorry. The volume specified is Not a Number.");

          //Check some things
          if(args[0] > music.maxVolume) return message.channel.send("⛔ | Sorry. The volume specified is bigger than the max queue size.");
          if(args[0] < 1) return message.channel.send("⛔ | Sorry. The volume specified is smaller than 1.");

          //Get the dispatcher
          let dispatcher = message.guild.me.voiceChannel.connection.player.dispatcher;

          //Set the volume
          dispatcher.setVolume(args[0] / 100);

          //Set volume in the server array
          server.volume=args[0];

          //Send the confirmation
          message.channel.send("⏫ | Success. I have turned the volume to " + server.volume + ".");
          }
    }


};