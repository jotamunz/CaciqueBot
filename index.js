require('dotenv').config()
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v10')
const { Player } = require('discord-player')
const Discord = require('discord.js')
const { ActivityType } = require('discord.js')
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.MessageContent
    ]
})
const fs = require('fs')
const { getPlayEmbed, getErrorEmbed, getQueuedSongEmbed, getQueuedPlaylistEmbed } = require('./utils')

client.config = require('./config.json')
client.errors = require('./errors.js')
client.player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
})
client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()
client.slash_commands = new Discord.Collection()
slash_commands = []

// Temporary fix to prioritize a certain youtube downloader
process.env.DP_FORCE_YTDL_MOD = '@distube/ytdl-core'

// Load the list of commands
fs.readdir('./commands/', (err, files) => {
    if (err) return console.log('Could not find any commands!')
    const jsFiles = files.filter(f => f.split('.').pop() === 'js')
    if (jsFiles.length <= 0) return console.log('Could not find any commands!')
    jsFiles.forEach(file => {
        const { cmd, s_cmd, s_cmd_alias } = require(`./commands/${file}`)
        // Load the prefix commands.
        client.commands.set(cmd.name, cmd)
        if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))
        // Load the slash commands.
        if (s_cmd) {
            client.slash_commands.set(s_cmd.data.name, s_cmd)
            slash_commands.push(s_cmd.data.toJSON())
        }
        if (s_cmd_alias) {
            client.slash_commands.set(s_cmd_alias.data.name, s_cmd_alias)
            slash_commands.push(s_cmd_alias.data.toJSON())
        }
        console.log(`Loaded ${file}`)
    })
})

// Bot startup
client.on('ready', () => {
    console.log(`${client.user.tag} is online.`)
    // Get all ids of the servers
    const guild_ids = client.guilds.cache.map(guild => guild.id)

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
    for (const guildId of guild_ids) {
        rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), {
            body: slash_commands
        })
            .then(() => console.log('Successfully updated commands for guild ' + guildId))
            .catch(console.error)
    }

    // Set activity status
    client.user.setActivity(`${client.config.prefix}help`, {
        type: ActivityType.Listening
    })
})

// Handle prefix commands
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return
    const prefix = client.config.prefix
    if (!message.content.startsWith(prefix)) return
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
    if (!cmd) return
    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        return message.channel.send(client.errors.NO_VOICE_CHANNEL())
    }
    try {
        cmd.run(client, message, args)
    } catch (e) {
        console.error(e)
        message.channel.send(client.errors.DEFAULT_ERROR())
    }
})

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
    const slash_command = client.slash_commands.get(interaction.commandName)
    if (!slash_command) return
    try {
        await slash_command.execute({ client, interaction })
    } catch (error) {
        console.error(error)
        await interaction.reply(client.errors.DEFAULT_ERROR())
    }
})

const messages = {}
client.player.events
    .on('playerStart', (queue, song) => {
        client.emit('trackEnd', queue.metadata.channel.guild.id)
        queue.metadata.channel
            .send({ embeds: [getPlayEmbed(queue, song)] })
            .then(message => (messages[`${queue.metadata.channel.guild.id}`] = message))
    })
    .on('audioTrackAdd', (queue, song) => queue.metadata.channel.send({ embeds: [getQueuedSongEmbed(queue, song)] }))
    .on('audioTracksAdd', (queue, songs) =>
        queue.metadata.channel.send({ embeds: [getQueuedPlaylistEmbed(queue, songs)] })
    )
    .on('error', (queue, error) => {
        client.emit('trackEnd', queue.metadata.channel.guild.id)
        queue.metadata.channel.send(client.errors.DEFAULT_ERROR())
        console.error(error.message)
    })
    .on('playerError', (queue, error) => {
        client.emit('trackEnd', queue.metadata.channel.guild.id)
        queue.metadata.channel.send(client.errors.DEFAULT_ERROR())
        console.error(error.message)
    })
    .on('emptyChannel', queue => {
        client.emit('trackEnd', queue.metadata.channel.guild.id)
        queue.metadata.channel.send({ embeds: [getErrorEmbed('Leaving...', 'Disconnected due to inactivity.')] })
    })

client.on('trackEnd', (guildId = 0) => {
    if (messages[`${guildId}`]) {
        messages[`${guildId}`].delete()
        messages[`${guildId}`] = null
    }
})

client.login(process.env.TOKEN)
