const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

function pauseSuccess(isPaused) {
    if (isPaused) return ':pause_button: Paused the song.'
    else return ':arrow_forward: Resumed the song.'
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'pause',
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            await queue.node.setPaused(!queue.node.isPaused())
            message.channel.send({ embeds: [getSuccessEmbed(pauseSuccess(queue.node.isPaused()))] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('pause').setDescription('Pauses playback.'),
        async execute({ client, interaction }) {
            // Check if a queue exists.
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            // Pause or unpause the queue.
            await queue.node.setPaused(!queue.node.isPaused())
            interaction.reply({ embeds: [getSuccessEmbed(pauseSuccess(queue.node.isPaused()))] })
        }
    }
}
