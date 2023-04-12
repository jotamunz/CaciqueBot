const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed, getVolumeFormat } = require('../utils')

module.exports = {
    // Prefix command
    cmd: {
        name: 'volume',
        aliases: ['v', 'vol'],
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            const volume = parseInt(args[0])
            if (isNaN(volume) || volume < 0 || volume > 100) return message.channel.send(client.errors.NAN())
            const success = queue.node.setVolume(volume)
            message.channel.send(
                success ? { embeds: [getSuccessEmbed(getVolumeFormat(volume))] } : client.errors.DEFAULT_ERROR()
            )
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('volume')
            .setDescription('Set the volume of the queue.')
            .addNumberOption(option => option.setName('volume').setDescription('Volume amount.').setRequired(true)),
        async execute({ client, interaction }) {
            // Check if a queue exists.
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            // Validate that a valid number has been input.
            const volume = interaction.options.getNumber('volume')
            if (isNaN(volume) || volume < 0 || volume > 100) return interaction.reply(client.errors.NAN())
            // Change the volume of the queue.
            const success = queue.node.setVolume(volume)
            interaction.reply(
                success ? { embeds: [getSuccessEmbed(getVolumeFormat(volume))] } : client.errors.DEFAULT_ERROR()
            )
        }
    }
}
