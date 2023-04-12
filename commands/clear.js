const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const clearSuccess = ':eject: Cleared the queue.'

module.exports = {
    // Prefix command
    cmd: {
        name: 'clear',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.tracks.toArray()[0]) return message.channel.send(client.errors.EMPTY_QUEUE())
            await queue.tracks.clear()
            message.channel.send({
                embeds: [getSuccessEmbed(clearSuccess)]
            })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clears the queue without stopping current playback.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.tracks.toArray()[0]) return interaction.reply(client.errors.EMPTY_QUEUE())
            await queue.tracks.clear()
            return interaction.reply({
                embeds: [getSuccessEmbed(clearSuccess)]
            })
        }
    }
}
