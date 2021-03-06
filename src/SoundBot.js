const config = require('config');
const Discord = require('discord.js');
const Util = require('./Util.js');

voiceConn = null;
connID = null;
var joinedUsers = [];
var userCount = [];
var channelUsers = null;
var counter = null;
var chanSounds = Util.getChanSounds();
var pictures = Util.getPictures();
var dispatcher = null;
var helpmsg = "Type !help for commands";

class SoundBot extends Discord.Client {
  constructor() {
    super();

    this.prefix = config.get('prefix');
    this.queue = [];
    this._addEventListeners();
  }

  _addEventListeners() {
    this.on('ready', this._readyListener);
	this.on('ready', () => { this.user.setActivity(helpmsg) } );
    this.on('message', this._messageListener);
	this.on('voiceStateUpdate', this._voiceStateListener);
  }

  _voiceStateListener(newMember, oldMember) {
        
    if (oldMember.serverMute && !newMember.serverMute && oldMember.voiceChannelID != null && newMember.voiceChannelID != null) {
        if (oldMember.voiceChannel.id == connID) {
            var sound = "servermute";
            const message = null;
            const id = connID;
            
            console.log(oldMember.user.username + " got server muted at " + new Date().toLocaleString());
            
            this.addToQueue(id, sound, message);
            
            if (voiceConn != null && voiceConn.speaking) {
                return;
              }
            else {
              this.playChanSoundQueue();
			}
        }
    return;
    }

	else if (oldMember.selfMute && !newMember.selfMute && oldMember.voiceChannelID != null && newMember.voiceChannelID != null) {
		if (oldMember.voiceChannel.id == connID) {
			var sound = oldMember.user.username + '_mute';
		    const message = null;
			const id = newMember.voiceChannelID;
			
			if (chanSounds.includes(sound)) {
			
			  this.addToQueue(id, sound, message);
			
              if (voiceConn != null && voiceConn.speaking) {
                return;
              }
              else {
                this.playChanSoundQueue();
			  }
		    }
			else {
			  
			  sound = "micmuted";
			
			  this.addToQueue(id, sound, message);
			
              if (voiceConn != null && voiceConn.speaking) {
                return;
              }
              else {
                this.playChanSoundQueue();
			  }
			}
		}
    return;
	}

    if (oldMember.voiceChannelID == null) {

      if (oldMember.user.username != "Soundboard") {
          
        const sound = newMember.user.username + '_leave';
        const message = null;
        const id = newMember.voiceChannelID;
        
        if (newMember.voiceChannelID == connID) {
          channelUsers = newMember.voiceChannel.members.array();

          userCount = [];
    
	      for (counter = 0; counter < channelUsers.length; counter++) {
	        if (! channelUsers[counter].user.bot) {
	          userCount.push(channelUsers[counter].user.username);
  	        }
          }
          if (userCount.length < 1) {
          voiceConn.disconnect();
          console.log("Leaving " + voiceConn.channel.name + " because it's empty");
          return;
          }        
          if (chanSounds.includes(sound)) {
            this.addToQueue(id, sound, message);
            try {
            console.log("Played " + newMember.user.username + "'s leave sound in " + newMember.voiceChannel.name + " at " + new Date().toLocaleString());
            }
            catch (error) {
              console.log(error);
            }
            if (voiceConn != null && voiceConn.speaking) {
              return;
            }
            else {
              this.playChanSoundQueue();
            }
          }
        }
      }
    return; 
    }


    else if (newMember.voiceChannelID == null) {
      if (newMember.user.username != "Soundboard") {
        const sound = newMember.user.username;
        const message = null;
        const id = oldMember.voiceChannelID;
        
        if (chanSounds.includes(sound)) {
          this.addToQueue(id, sound, message);
          try {
          console.log("Played " +sound + "'s join sound in " + oldMember.voiceChannel.name + " at " + new Date().toLocaleString());
          }
          catch(error) {
            console.log(error);
          }
          if (voiceConn != null && voiceConn.speaking) {
            return;
          }
          else {
            this.playChanSoundQueue();
          }
        }
      }
    return;
    }

    else if (newMember.voiceChannelID != oldMember.voiceChannelID && oldMember.voiceChannelID != null && newMember.voiceChannelID != null) {
      if (oldMember.user.username != "Soundboard") {
        const sound = newMember.user.username;
        const message = null;
        const id = oldMember.voiceChannelID;
        
        if (chanSounds.includes(sound)) {
          this.addToQueue(id, sound, message);
          try {
          console.log("Played " +sound + "'s join sound in " + oldMember.voiceChannel.name + " because they changed their channel" + " at " + new Date().toLocaleString());
          }
          catch(error) {
            console.log(error);
          }
          if (voiceConn != null && voiceConn.speaking) {
            return;
          }
          else {
              this.playChanSoundQueue();
            }
          }
        }
      }
    return;
    }
	
  _readyListener() {
    const avatar = Util.avatarExists() ? './config/avatar.png' : null;
    this.user.setAvatar(avatar);
  }

  _messageListener(message) {
    var commands = ["!add", "!remove", "!addjoin", "!addleave", "!rmleave", "!rmjoin", "!commands", "!sounds", "!rename", "!mostplayed"]
    if (message.channel instanceof Discord.DMChannel && commands.indexOf(message.content) < 0) return; // Abort when DM
    if (!message.content.startsWith(this.prefix)) return; // Abort when not prefix
    if (Util.userIgnored(message.author.id)){
        message.channel.send('neked nem.')
        return;
    }
    if (message.member.deaf) {
        message.channel.send('Ha nem hallod, minek kéred?');
        return;
    }
/*    if (message.member.user.username == "ZeLoD") {
        message.channel.send('neked nem.')
        return;
    }*/
    message.content = message.content.substring(this.prefix.length);
    this.handle(message);
  }

  start() {
    this.login(config.get('token'));
  }
  
  restart(message) {
    this.destroy();
    message.member.voiceChannel.leave();
    this.login(config.get('token'));
  }

  handle(message) {
    const [command, ...input] = message.content.split(' ');
    switch (command) {
      case 'restart':
        this.restart(message);
        message.delete();
        break;
      case 'commands':
	  case 'help':
        message.author.send(Util.getListOfCommands());
        break;
	  case 'list':
      case 'sounds':
        message.author.send(Util.getSounds().map(sound => sound), {split : true});
        break;
      case 'mostplayed':
        message.channel.send(Util.getMostPlayedSounds());
        break;
      case 'lastadded':
        message.channel.send(['```', ...Util.lastAdded(), '```'].join('\n'));
        break;
      case 'add':
        if (message.attachments) Util.addSounds(message.attachments, message.channel);
        break;
      case 'rename':
        Util.renameSound(input, message.channel);
        break;
      case 'remove':
        Util.removeSound(input, message.channel);
        break;
      case 'ignore':
        Util.ignoreUser(input, message);
        break;
      case 'unignore':
        Util.unignoreUser(input, message);
        break;
      case 'addmute':
        if (message.attachments) Util.addMuteSounds(message.attachments, message.channel, chanSounds);
        break;
      case 'rmmute':
        Util.removeMuteSound(input, message.channel, chanSounds);
        break;
	  case 'addjoin':
	    if (message.attachments) Util.addJoinSounds(message.attachments, message.channel, chanSounds);
		break;
	  case 'rmjoin':
	    Util.removeJoinSound(input, message.channel, chanSounds);
		break;
	  case 'addleave':
	    if (message.attachments) Util.addLeaveSounds(message.attachments, message.channel, chanSounds);
		break;
	  case 'rmleave':
	    Util.removeLeaveSound(input, message.channel, chanSounds);
        break
      default:
        this.handleSoundCommands(message);
        break;
    }
  }

  handleSoundCommands(message) {
    const sounds = Util.getSounds();
    const voiceChannel = message.member.voiceChannel;

    if (voiceChannel === undefined) {
      message.reply('Join a voice channel first!');
      return;
    }

    switch (message.content) {
      case 'stop':
        voiceChannel.leave();
        this.queue = [];
        break;
      case 'random':
        const random = sounds[Math.floor(Math.random() * sounds.length)];
        this.addToQueue(voiceChannel.id, random, message);
        break;
      default:
        const sound = message.content;
        if (sounds.includes(sound)) {
          this.addToQueue(voiceChannel.id, sound, message);
          if (!this._currentlyPlaying()) this.playSoundQueue();
        }
        break;
    }
  }

  addToQueue(voiceChannel, sound, message) {
    this.queue.push({ name: sound, channel: voiceChannel, message });
  }

  _currentlyPlaying() {
    return this.voiceConnections.some(connection => connection.speaking);
  }
  
  playSeparator() {
    const nextSound = this.queue[0];

    if (chanSounds.includes(nextSound.name)) {
      this.playChanSoundQueue();
    }
    else {
      if (pictures.includes(nextSound.name)) {
        nextSound.message.channel.send('', {file: Util.getPathForPicture(nextSound.name)});
      }
      this.playSoundQueue();
    }
  }

  playSoundQueue() {
    const nextSound = this.queue.shift();
    const file = Util.getPathForSound(nextSound.name);
    const voiceChannel = this.channels.get(nextSound.channel);
	channelUsers = voiceChannel.members.array();
    
	for (counter = 0; counter < channelUsers.length; counter++) {
		if (! channelUsers[counter].user.bot) {
			userCount.push(channelUsers[counter].user.username);
		}
	}
	
    voiceChannel.join().then((connection) => {
	  connID = voiceChannel.id;
      voiceConn = connection;
      const dispatcher = connection.playFile(file);
	  dispatcher.on('start', () => {
      voiceConn.player.streamingData.pausedTime = 0;
      });
      dispatcher.on('end', () => {
        Util.updateCount(nextSound.name);
        if (config.get('deleteMessages') === true) nextSound.message.delete();

        if (this.queue.length === 0) {
          if (!config.get('stayInChannel')) connection.disconnect();
          return;
        }

        this.playSeparator();
      });
    }).catch((error) => {
      console.log('Error occured!');
      console.log(error);
    });
  }
  
  playChanSoundQueue() {
    const nextSound = this.queue.shift();
    const file = Util.getChanPathForSound(nextSound.name);
    const voiceChannel = this.channels.get(nextSound.channel);
	channelUsers = voiceChannel.members.array();

    userCount = [];
    
	for (counter = 0; counter < channelUsers.length; counter++) {
	  if (! channelUsers[counter].user.bot) {
	    userCount.push(channelUsers[counter].user.username);
  	  }
    }

    voiceChannel.join().then((connection) => {
	  connID = voiceChannel.id;
      voiceConn = connection;

      const dispatcher = connection.playFile(file);
	  dispatcher.on('start', () => {
      voiceConn.player.streamingData.pausedTime = 0;
      });
      dispatcher.on('end', () => {
        Util.updateCount(nextSound.name);

        if (this.queue.length === 0) {
          if (!config.get('stayInChannel')) connection.disconnect();
          return;
        }

        this.playSeparator();
      });
    }).catch((error) => {
      console.log('Error occured!');
      console.log(error);
    });
  }
}

module.exports = SoundBot;
