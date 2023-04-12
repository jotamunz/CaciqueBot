const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

const resumeSuccess = ':arrow_forward: Resumed the song.'

module.exports = {
    // Prefix command
    cmd: {
        name: 'resume',
        aliases: ['unpause'],
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            await queue.node.resume()
            message.channel.send({ embeds: [getSuccessEmbed(resumeSuccess)] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('resume').setDescription('Resumes playback.'),
        async execute({ client, interaction }) {
            // Check if a queue exists.
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            // Resume the queue.
            await queue.node.resume()
            interaction.reply({ embeds: [getSuccessEmbed(resumeSuccess)] })
        }
    }
}
