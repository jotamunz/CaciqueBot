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
        smoothVolume: true,
        highWaterMark: 1 << 25
    }
})
client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()
client.slash_commands = new Discord.Collection()
slash_commands = []

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
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

    // Delete command definitions in dev server
    // rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID), { body: [] })
    //     .then(() => console.log('Successfully deleted commands for guild ' + process.env.DEV_GUILD_ID))
    //     .catch(console.error)

    // Delete command definitions in all servers
    // rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
    //     .then(() => console.log('Successfully deleted all application commands.'))
    //     .catch(console.error)

    // Update command definitions in dev server
    // rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID), {
    //     body: slash_commands
    // })
    //     .then(() => console.log('Successfully updated commands for guild ' + process.env.DEV_GUILD_ID))
    //     .catch(console.error)

    // Update command definitions in all servers
    // rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID), {
    //     body: slash_commands
    // })
    //     .then(() => console.log('Successfully updated all application commands.'))
    //     .catch(console.error)

    // Set activity status
    const setActivity = () =>
        client.user.setActivity(`${client.config.prefix}help`, {
            type: ActivityType.Listening
        })
    setActivity()

    // Refresh activity every hour
    setInterval(function () {
        setActivity()
    }, 5 * 1000)
})

// Register slash commands when bot joins a new guild
client.on('guildCreate', async guild => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), {
        body: slash_commands
    })
        .then(() => console.log('Successfully registered commands in guild ' + guild.id))
        .catch(console.error)
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
// .on('debug', async (queue, message) => {
//     // Emitted when the player queue sends debug info
//     console.log(`Player debug event: ${message}`);
// });

// client.player.on('debug', async message => {
//     // Emitted when the player sends debug info
//     console.log(`Player debug event: ${message}`)
// })

client.on('trackEnd', (guildId = 0) => {
    if (messages[`${guildId}`]) {
        messages[`${guildId}`].delete()
        messages[`${guildId}`] = null
    }
})

client.login(process.env.TOKEN)
