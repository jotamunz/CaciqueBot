const { SlashCommandBuilder } = require('@discordjs/builders')
const { QueryType } = require('discord-player')

module.exports = {
    // Prefix command
    cmd: {
        name: 'play',
        aliases: ['p'],
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const query = args.join(' ')
            if (!query) return message.channel.send(client.errors.NO_QUERY())
            // Search for the song
            const result = await client.player.search(query, {
                requestedBy: message.member,
                searchEngine: QueryType.AUTO
            })
            if (!result || !result.tracks.length) {
                return message.channel.send(client.errors.NO_RESULT(query))
            }
            // Creates a queue if it doesnt exist
            const queue = await client.player.nodes.create(message.guild, {
                metadata: {
                    channel: message.channel,
                    client: message.guild.members.me
                },
                selfDeaf: true,
                skipOnNoStream: true,
                volume: 100,
                leaveOnEnd: client.config.leaveOnEnd,
                leaveOnEndCooldown: client.config.leaveOnEndCooldown,
                leaveOnStop: client.config.leaveOnStop,
                leaveOnEmpty: client.config.leaveOnEmpty,
                leaveOnEmptyCooldown: client.config.leaveOnEmptyCooldown
            })
            try {
                if (!queue.connection) await queue.connect(message.member.voice.channel)
            } catch (error) {
                client.player.deleteQueue(message.guild.id)
                return message.channel.send(client.errors.DEFAULT_ERROR(error))
            }
            // Play the song
            queue.addTrack(result.playlist ? result.tracks : result.tracks[0])
            if (!queue.node.isPlaying()) await queue.node.play()
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('play')
            .setDescription('Play a song or playlists.')
            .addStringOption(option => option.setName('song').setDescription('Song name or link').setRequired(true)),
        async execute({ client, interaction }) {
            await interaction.deferReply()
            // Make sure the user is inside a voice channel
            if (!interaction.member.voice.channel) return interaction.editReply(client.errors.NO_VOICE_CHANNEL())
            const query = interaction.options.getString('song')
            // Search for the song
            const result = await client.player.search(query, {
                requestedBy: interaction.member,
                searchEngine: QueryType.AUTO
            })
            if (!result || !result.tracks.length) {
                return interaction.editReply(client.errors.NO_RESULT(query))
            }
            // Creates a queue if it doesnt exist
            const queue = await client.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me
                },
                selfDeaf: true,
                skipOnNoStream: true,
                volume: 100,
                leaveOnEnd: client.config.leaveOnEnd,
                leaveOnEndCooldown: client.config.leaveOnEndCooldown,
                leaveOnStop: client.config.leaveOnStop,
                leaveOnEmpty: client.config.leaveOnEmpty,
                leaveOnEmptyCooldown: client.config.leaveOnEmptyCooldown
            })
            try {
                if (!queue.connection) await queue.connect(interaction.member.voice.channel)
            } catch (error) {
                client.player.deleteQueue(interaction.guildId)
                return interaction.editReply(client.errors.DEFAULT_ERROR())
            }
            // Play the song
            queue.addTrack(result.playlist ? result.tracks : result.tracks[0])
            if (!queue.node.isPlaying()) await queue.node.play()
            await interaction.deleteReply()
        }
    }
}
