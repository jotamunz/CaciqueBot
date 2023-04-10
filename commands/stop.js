const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const stopSuccess = ':stop_button: Stopped.'

module.exports = {
    // Prefix command
    cmd: {
        name: 'stop',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.node.isPlaying()) return message.channel.send(client.errors.EMPTY_QUEUE())
            await queue.delete()
            await client.emit('trackEnd', message.guild.id)
            message.channel.send({ embeds: [getSuccessEmbed(stopSuccess)] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('stop').setDescription('Stops playback and clears the queue.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.node.isPlaying()) return interaction.reply(client.errors.EMPTY_QUEUE())
            await queue.delete()
            await client.emit('trackEnd', interaction.guildId)
            return interaction.reply({ embeds: [getSuccessEmbed(stopSuccess)] })
        }
    }
}
