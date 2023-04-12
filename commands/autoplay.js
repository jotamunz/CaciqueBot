const { SlashCommandBuilder } = require('@discordjs/builders')
const { QueueRepeatMode } = require('discord-player')
const { getSuccessEmbed } = require('../utils')

function getAutoPlayStatus(autoplay) {
    return `:infinity: AutoPlay: \`${autoplay === QueueRepeatMode.AUTOPLAY ? 'On' : 'Off'}\``
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'autoplay',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            const action =
                queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY
            queue.setRepeatMode(action)
            const autoPlayStatus = getAutoPlayStatus(action)
            message.channel.send({ embeds: [getSuccessEmbed(autoPlayStatus)] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('autoplay')
            .setDescription('Enable or disable autoplay of similar songs.'),
        async execute({ client, interaction }) {
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            const action =
                queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY
            queue.setRepeatMode(action)
            const autoPlayStatus = getAutoPlayStatus(action)
            return interaction.reply({ embeds: [getSuccessEmbed(autoPlayStatus)] })
        }
    }
}
