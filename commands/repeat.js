const { SlashCommandBuilder } = require('@discordjs/builders')
const { QueueRepeatMode } = require('discord-player')
const { getSuccessEmbed, getRepeatModeFormat } = require('../utils')

function repeatSuccess(mode) {
    modeName = mode ? (mode === QueueRepeatMode.QUEUE ? 'Queue' : 'Song') : 'Off'
    return `${getRepeatModeFormat(mode)} Repeat mode: ${modeName}`
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'repeat',
        aliases: ['loop', 'rp'],
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            let mode
            switch (args[0]) {
                case 'off':
                    mode = QueueRepeatMode.OFF
                    break
                case 'song':
                    mode = QueueRepeatMode.TRACK
                    break
                case 'queue':
                    mode = QueueRepeatMode.QUEUE
                    break
                default:
                    return message.channel.send(client.errors.INVALID_MODE())
            }
            queue.setRepeatMode(mode)
            message.channel.send({ embeds: [getSuccessEmbed(repeatSuccess(mode))] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('repeat')
            .setDescription('Repeat a song or the whole queue.')
            .addIntegerOption(option =>
                option
                    .setName('mode')
                    .setDescription('Repetition type')
                    .setRequired(true)
                    .setChoices(
                        { name: 'Song', value: QueueRepeatMode.TRACK },
                        { name: 'Queue', value: QueueRepeatMode.QUEUE },
                        { name: 'Off', value: QueueRepeatMode.OFF }
                    )
            ),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            const mode = interaction.options.getInteger('mode')
            queue.setRepeatMode(mode)
            interaction.reply({ embeds: [getSuccessEmbed(repeatSuccess(mode))] })
        }
    }
}
