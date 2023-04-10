const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const successMsg = ':track_next: Song skipped.'

module.exports = {
    // Prefix command
    cmd: {
        name: 'skip',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.node.isPlaying()) return message.channel.send(client.errors.EMPTY_QUEUE())
            const success = await queue.node.skip()
            message.channel.send(success ? { embeds: [getSuccessEmbed(successMsg)] } : client.errors.DEFAULT_ERROR())
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('skip').setDescription('Skips the current song.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.node.isPlaying()) return interaction.reply(client.errors.EMPTY_QUEUE())
            const success = await queue.node.skip()
            interaction.reply(success ? { embeds: [getSuccessEmbed(successMsg)] } : client.errors.DEFAULT_ERROR())
        }
    }
}
