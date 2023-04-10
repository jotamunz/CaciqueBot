const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const successMsg = ':twisted_rightwards_arrows: Shuffled the queue.'

module.exports = {
    // Prefix command
    cmd: {
        name: 'shuffle',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.node.isPlaying() || !queue.tracks.toArray()[0])
                return message.channel.send(client.errors.EMPTY_QUEUE())
            await queue.tracks.shuffle()
            message.channel.send({ embeds: [getSuccessEmbed(successMsg)] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffles the queue.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.node.isPlaying() || !queue.tracks.toArray()[0])
                return interaction.reply(client.errors.EMPTY_QUEUE())
            await queue.tracks.shuffle()
            interaction.reply({ embeds: [getSuccessEmbed(successMsg)] })
        }
    }
}
