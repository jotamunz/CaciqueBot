require('dotenv').config()
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js')
const { Player } = require('discord-player')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v10')
const { YoutubeiExtractor } = require('discord-player-youtubei')
const fs = require('fs')
const { getPlayEmbed, getErrorEmbed, getQueuedSongEmbed, getQueuedPlaylistEmbed } = require('./utils')

// Client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
})

// Player setup
const player = new Player(client, {
    autoRegisterExtractor: false,
    ytdlOptions: {
        quality: 'highestaudio',
        smoothVolume: true,
        highWaterMark: 1 << 25
    }
})

// Add youtubei extractor, which is more reliable than the default youtube extractor
player.extractors.register(YoutubeiExtractor, {})

// Temporary fix to prioritize a certain youtube downloader
process.env.DP_FORCE_YTDL_MOD = '@distube/ytdl-core'

// Client configuration
client.config = require('./config.json')
client.errors = require('./errors.js')
client.player = player
client.commands = new Collection()
client.aliases = new Collection()
client.slash_commands = new Collection()
const slash_commands = []

// Load commands
function loadCommands() {
    const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
    for (const file of commandFiles) {
        const { cmd, s_cmd, s_cmd_alias } = require(`./commands/${file}`)

        // Load prefix commands
        client.commands.set(cmd.name, cmd)
        if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))

        // Load slash commands
        if (s_cmd) {
            client.slash_commands.set(s_cmd.data.name, s_cmd)
            slash_commands.push(s_cmd.data.toJSON())
        }
        if (s_cmd_alias) {
            client.slash_commands.set(s_cmd_alias.data.name, s_cmd_alias)
            slash_commands.push(s_cmd_alias.data.toJSON())
        }
        console.log(`Loaded ${file}`)
    }
}

// Bot startup
client.once('ready', async () => {
    await player.extractors.loadDefault(ext => ext !== 'YouTubeExtractor')
    console.log(`${client.user.tag} is online.`)

    setActivity()
    setInterval(setActivity, 5 * 60 * 1000) // Refresh activity every 5 minutes

    // Uncomment and use these functions as needed for managing slash commands
    // await deleteCommandsInDevServer();
    // await deleteCommandsInAllServers();
    // await updateCommandsInDevServer();
    // await updateCommandsInAllServers();
})

// Set activity status
function setActivity() {
    client.user.setActivity(`${client.config.prefix}help`, { type: ActivityType.Listening })
}

// Register slash commands when bot joins a new guild
client.on('guildCreate', async guild => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
    try {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), { body: slash_commands })
        console.log('Successfully registered commands in guild ' + guild.id)
    } catch (error) {
        console.error(error)
    }
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
        await cmd.run(client, message, args)
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

// Player events
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
    .on('error', handlePlayerError)
    .on('playerError', handlePlayerError)
    .on('emptyChannel', queue => {
        client.emit('trackEnd', queue.metadata.channel.guild.id)
        queue.metadata.channel.send({ embeds: [getErrorEmbed('Leaving...', 'Disconnected due to inactivity.')] })
    })

function handlePlayerError(queue, error) {
    client.emit('trackEnd', queue.metadata.channel.guild.id)
    queue.metadata.channel.send(client.errors.DEFAULT_ERROR())
    console.error(error.message)
}

client.on('trackEnd', (guildId = 0) => {
    if (messages[`${guildId}`]) {
        messages[`${guildId}`].delete()
        messages[`${guildId}`] = null
    }
})

// Initialize
loadCommands()
client.login(process.env.TOKEN)

// Utility functions for managing slash commands (commented out)
/*
async function deleteCommandsInDevServer() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID), { body: [] });
    console.log('Successfully deleted commands for guild ' + process.env.DEV_GUILD_ID);
}

async function deleteCommandsInAllServers() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('Successfully deleted all application commands.');
}

async function updateCommandsInDevServer() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID), { body: slash_commands });
    console.log('Successfully updated commands for guild ' + process.env.DEV_GUILD_ID);
}

async function updateCommandsInAllServers() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slash_commands });
    console.log('Successfully updated all application commands.');
}
*/
