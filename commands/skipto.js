const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

function skiptoSuccess(position) {
    return `:track_next: Skipped to position #${position}`
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'skipto',
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            const index = parseInt(args[0])
            if (isNaN(index) || index <= 0 || index > queue.tracks.toArray().length)
                return message.channel.send(client.errors.NAN())
            const track = queue.tracks.toArray()[index - 1]
            const success = await queue.node.skipTo(track)
            message.channel.send(
                success ? { embeds: [getSuccessEmbed(skiptoSuccess(index))] } : client.errors.DEFAULT_ERROR()
            )
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('skipto')
            .setDescription('Skips to the current song.')
            .addNumberOption(option =>
                option.setName('position').setDescription('Position of the song in the queue.').setRequired(true)
            ),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            const index = interaction.options.getNumber('position')
            if (isNaN(index) || index <= 0 || index > queue.tracks.toArray().length)
                return interaction.reply(client.errors.NAN())
            const track = queue.tracks.toArray()[index - 1]
            const success = await queue.node.skipTo(track)
            interaction.reply(
                success ? { embeds: [getSuccessEmbed(skiptoSuccess(index))] } : client.errors.DEFAULT_ERROR()
            )
        }
    }
}
