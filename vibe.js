/*
MIT License



Copyright (c) 2018 Oliver James Kennewell (NightmareDiscord)



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

//Require packages
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const search = require("youtube-search");
const PACKAGE = require("./package.json");

/*

 * @param {Client} bot - The discord.js client.

 * @param {object} options - Options to configure the client bot.

*/

//Start the module
exports.start = (bot, options) => {

    //Get the Music class
    class Music {
  
      constructor(bot, options) {
  
        this.youtubeAPIKey = (options && options.youtubeAPIKey);
  
        this.botPrefix = (options && options.prefix) || '!';
  
        this.embedColor = (options && options.embedColor) || 'RED';
  
        this.maxQueueSize = parseInt((options && options.maxQueueSize) || 50);

        this.maxVolume = parseInt((options && options.maxVolume) || 200);
      }
  
    }
  
  
  
    var music = new Music(bot, options);
  
    exports.bot = music;

    //Message event
    bot.on("message", async message => {

        //Variables
        let args = message.content.slice(music.botPrefix.length).trim().split(" ");
        let cmd = args.shift().toLowerCase();

         if(!message.content.startsWith(music.botPrefix)) return;

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

        if(cmd === "loop") {
          loopCMD(message, args);
        }
        
    });

        let queue = {}

        async function getQueue(guild) {

          if (!queue[guild]) queue[guild] = {
            queue: [],
            songNames: [],
            songRequesters: [],
            loop: 0,
          };

          return queue[guild];

        }

         async function play(message, connection, server) {

         server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: 'audioonly'}));

         //Set the volume
         server.dispatcher.setVolume(parseInt(200 / 100));
         
         server.dispatcher.on("end", async function() {

         //If loop is of
         if(server.loop === 0) {
             //Get rid of the just played song
             server.queue.shift();
             server.songRequesters.shift();
             server.songNames.shift();
         }

         //If there is another song
         if(server.queue[0]) {
         play(message, connection, server);

          if(server.loop === 1) return;
          let id = await ytdl.getVideoID(server.queue[0]);
            let embed = new Discord.RichEmbed()
            .setColor(music.embedColor)
            .setTitle("Now Playing")
            .setDescription(`**Now Playing**: ${server.songNames[0]}.\n**Song Requester**: ${server.songRequesters[0]}.`)
            .setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)
            message.channel.send(embed)
         } 
         if(!server.queue[0]) {
                    //If there isn't 
                   connection.disconnect();
                    message.channel.send("💨 | Queue is empty.");
         }
         
         });
       }

      async function playCMD(message, args) {

        const server = await getQueue(message.guild.id);
             
        //Check if the member is in a voice channel
      if(!message.member.voiceChannel) return message.channel.send("❌ | Please join a Voice Channel.");

      //Check if a song is mentioned
      if(!args.join(" ")) return message.channel.send("❌ | Please specify a Search String or a URL.");

      //Check if they have reached the max queue limit
      if(server.queue === music.maxQueueSize) return message.channel.send("❌ | Sorry. You have reached the max queue size.");

      //Get the search options
      var opts = {
          maxResults: 1,
          key: music.youtubeAPIKey
        };

        

        //Search for the song
        search(args.join(" "), opts, async function(err, results) {
          //Catch the error
          if(err) message.channel.send("❌ | Sorry. There was an error searching that song.") && console.log(err);

          //The first result
          let res = results[0];

          //Push to the queue
          server.queue.push(res.link);
          server.songNames.push(res.title);
          server.songRequesters.push(message.author.tag);

          //Send the message
          let id = await ytdl.getVideoID(res.link)
          let embed = new Discord.RichEmbed()
          .setColor(music.embedColor)
          .setTitle("Added to queue")
          .setDescription(`**Added**: ${res.title}.\n**Requester**: ${message.author.tag}`)
          .setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)
          message.channel.send(embed);

          if(!message.guild.me.voiceChannel) await message.member.voiceChannel.join().then(function(connection) {
              play(message, connection, server);
            });
          
        });
      }

      async function pauseCMD(message, args) {

        //Get the server 
        let server = await getQueue(message.guild.id);

        //Check if there is a queue
        if(server.queue[0] === null) return message.channel.send("❌ | Sorry. Nothing is playing at the moment.");

        //Get the dispatcher
        let dispatcher = message.guild.me.voiceChannel.connection.player.dispatcher;

        //Pause the song
        dispatcher.pause();
  
        message.channel.send("▶ | Success. I have paused the current song.");

      }

      async function resumeCMD(message, args) {

        //Get the server 
        let server = await getQueue(message.guild.id);

        //Check if there is a queue
        if(server.queue[0] === null) return message.channel.send("❌ | Sorry. Nothing is playing at the moment.");

        //Get the dispatcher
        let dispatcher = message.guild.me.voiceChannel.connection.player.dispatcher;

        //Pause 
        dispatcher.resume();

        message.channel.send("⏸ | Success. I have resumed the current song");
      }

      async function leaveCMD(message, args) {

        //Check if the bot is in a voice channel
        if(!message.guild.me.voiceChannel) return message.channel.send("❌ | Sorry. I'm not in a Voice Channel.");

        //Check if the member is in the bots voice channel
        if(message.member.voiceChannel !== message.guild.me.voiceChannel) return message.channel.send("❌ | Please join my Voice Channel.");

        //Leave the voice channel
        message.guild.me.voiceChannel.leave();

        message.channel.send("💨 | Success. I have left the Voice Channel.");
      }

      async function skipCMD(message, args) {

        //Get the server 
        let server = await getQueue(message.guild.id);

        //Check if there is a queue
        if(server.queue[0] === null) return message.channel.send("❌ | Sorry. Nothing is playing at the moment.");

        //Get the dispatcher
        let dispatcher = message.guild.me.voiceChannel.connection.player.dispatcher;

        //Turn loop off
        server.loop=0

        //Pause 
         dispatcher.end();

        message.channel.send("⏩ | Success. I have Skipped the current song");
      }


      async function queueCMD(message, args) {

                //Get the server 
                let server = await getQueue(message.guild.id);

                //Check if there is a queue
                if(server.queue[0] === null) return message.channel.send("❌ | Sorry. There is nothing in the queue.");

                //Send the queue
                let embed = new Discord.RichEmbed()
                .setColor(music.embedColor)
                .setTitle("Server Queue: " + message.guild.name)
                .setThumbnail(message.guild.iconURL)
                .setDescription(server.songNames)
                message.channel.send(embed);

      }

      async function loopCMD(message, args) {

        //Get the servers queue
        let server = await getQueue(message.guild.id);

        //Check if there is a queue
        if(server.queue[0] === null) return message.channel.send("❌ | Sorry. There is nothing in the queue.");

        if(server.loop === 0) {
          
          server.loop=1

          message.channel.send("🔂 | Success. Loop is now **enabled**.");

        } else if(server.loop === 1) {

          server.loop=0

          message.channel.send("▶ | Success. Loop is now **disabled**.");

        }

      }

    

};