const { SlashCommandBuilder } = require('@discordjs/builders')
const { getPlayEmbed } = require('../utils')

module.exports = {
    // Prefix command
    cmd: {
        name: 'nowplaying',
        aliases: ['np'],
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            return message.channel.send({
                embeds: [getPlayEmbed(queue, queue.currentTrack)]
            })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('nowplaying')
            .setDescription('Shows the song that is currently playing.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            return interaction.reply({ embeds: [getPlayEmbed(queue, queue.currentTrack)] })
        }
    }
}
