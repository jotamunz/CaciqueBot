const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const prevSuccess = ':track_previous: Song reverted.'

module.exports = {
    cmd: {
        // Prefix command
        name: 'previous',
        aliases: ['prev'],
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            if (!queue.history.previousTrack) return message.channel.send(client.errors.NO_PREVIOUS())
            await queue.history.back()
            message.channel.send({ embeds: [getSuccessEmbed(prevSuccess)] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('previous').setDescription('Play the previous song.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            if (!queue.history.previousTrack) return interaction.reply(client.errors.NO_PREVIOUS())
            await queue.history.back()
            interaction.reply({ embeds: [getSuccessEmbed(prevSuccess)] })
        }
    }
}
