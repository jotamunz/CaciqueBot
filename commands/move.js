const { SlashCommandBuilder } = require('@discordjs/builders')
const { getSuccessEmbed } = require('../utils')

function moveSuccess(fromIndex, toIndex) {
    if (fromIndex >= toIndex) return `:arrow_double_up: Moved song #\`${fromIndex}\` to position #\`${toIndex}\`.`
    else return `:arrow_double_down: Moved song #\`${fromIndex}\` to position #\`${toIndex}\`.`
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'move',
        inVoiceChannel: true,
        run: async (client, message, args) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue) return message.channel.send(client.errors.EMPTY_QUEUE())
            const fromIndex = parseInt(args[0])
            if (isNaN(fromIndex) || fromIndex <= 0 || fromIndex > queue.tracks.toArray().length)
                return message.channel.send(client.errors.NAN())
            const toIndex = parseInt(args[1])
            if (isNaN(toIndex) || toIndex <= 0 || toIndex > queue.tracks.toArray().length)
                return message.channel.send(client.errors.NAN())
            const track = queue.tracks.toArray()[fromIndex - 1]
            await queue.moveTrack(track, toIndex - 1)
            message.channel.send({
                embeds: [getSuccessEmbed(moveSuccess(fromIndex, toIndex))]
            })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder()
            .setName('move')
            .setDescription('Moves a song from one position to another in the queue.')
            .addNumberOption(option =>
                option.setName('current').setDescription('Current position of the song.').setRequired(true)
            )
            .addNumberOption(option =>
                option.setName('target').setDescription('Target position of the song.').setRequired(true)
            ),
        async execute({ client, interaction }) {
            // Check if a queue exists.
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue) return interaction.reply(client.errors.EMPTY_QUEUE())
            // Validate that a valid number has been input.
            const fromIndex = interaction.options.getNumber('current')
            const toIndex = interaction.options.getNumber('target')
            if (isNaN(fromIndex) || fromIndex <= 0 || fromIndex > queue.tracks.toArray().length)
                return interaction.reply(client.errors.NAN())
            if (isNaN(toIndex) || toIndex <= 0 || toIndex > queue.tracks.toArray().length)
                return interaction.reply(client.errors.NAN())
            // Find the track item and move it in the queue
            const track = queue.tracks.toArray()[fromIndex - 1]
            await queue.moveTrack(track, toIndex - 1)
            interaction.reply({
                embeds: [getSuccessEmbed(moveSuccess(fromIndex, toIndex))]
            })
        }
    }
}
