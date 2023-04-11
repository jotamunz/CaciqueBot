const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

function removeSuccess(index) {
    return `:eject: Removed song #\`${index}\` from the queue.`
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'remove',
        aliases: ['rm'],
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.node.isPlaying()) return message.channel.send(client.errors.EMPTY_QUEUE())
            const index = parseInt(args[0])
            if (isNaN(index) || index <= 0 || index > queue.tracks.toArray().length)
                return message.channel.send(client.errors.NAN())
            await queue.node.remove(index - 1)
            message.channel.send({ embeds: [getSuccessEmbed(removeSuccess(index))] })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('remove')
            .setDescription('Remove a song from the queue.')
            .addNumberOption(option =>
                option.setName('position').setDescription('Position of the song in the queue.').setRequired(true)
            ),
        async execute({ client, interaction }) {
            // Check if a queue exists.
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.node.isPlaying()) return interaction.reply(client.errors.EMPTY_QUEUE())
            // Validate that a valid number has been input.
            const index = interaction.options.getNumber('position')
            if (isNaN(index) || index <= 0 || index > queue.tracks.toArray().length)
                return interaction.reply(client.errors.NAN())
            // Remove the song from the queue.
            await queue.node.remove(index - 1)
            interaction.reply({ embeds: [getSuccessEmbed(removeSuccess(index))] })
        }
    }
}
