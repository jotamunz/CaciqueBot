const { SlashCommandBuilder } = require('@discordjs/builders')
const { pagination, ButtonTypes, ButtonStyles } = require('@devraelfreeze/discordjs-pagination')
const { EmbedBuilder } = require('discord.js')
const colors = require('../colors.json')

const ITEMS_PER_PAGE = 10

function createPages(queue) {
    const pages = []
    // Format each tracks information for the embed
    const tracks = queue.tracks
        .toArray()
        .map((track, i) => `**${i + 1}. ${track.author} - ${track.title}** - \`${track.duration}\``)
    for (let i = 0; i < Math.ceil(tracks.length / ITEMS_PER_PAGE); i++) {
        const startIndex = i * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const embed = new EmbedBuilder()
            .setColor(colors.actionStatus)
            .setTitle('Music Queue')
            .setDescription(
                `Now Playing: **${queue.currentTrack.author} - ${queue.currentTrack.title}** - \`${queue.currentTrack.duration}\``
            )
            .addFields({
                name: ' ',
                value: `${tracks.slice(startIndex, endIndex).join('\n')}`
            })
        pages.push(embed)
    }
    return pages
}

module.exports = {
    // Prefix command
    cmd: {
        name: 'queue',
        aliases: ['q'],
        inVoiceChannel: true,
        run: async (client, message) => {
            const queue = client.player.nodes.get(message.guild.id)
            if (!queue || !queue.tracks.toArray()[0]) return message.channel.send(client.errors.EMPTY_QUEUE())
            const pages = createPages(queue)
            if (pages.length > 1)
                await pagination({
                    embeds: pages,
                    author: message.member.user,
                    message: message,
                    time: 60000,
                    disableButtons: true,
                    fastSkip: true,
                    pageTravel: true,
                    buttons: [
                        {
                            value: ButtonTypes.previous,
                            label: 'Previous',
                            style: ButtonStyles.Secondary
                        },
                        {
                            value: ButtonTypes.next,
                            label: 'Next',
                            style: ButtonStyles.Primary
                        }
                    ]
                })
            else
                message.channel.send({
                    embeds: [pages[0]]
                })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('queue').setDescription('Shows the music queue.'),
        async execute({ client, interaction }) {
            await interaction.deferReply()
            // Make sure there is an active queue with at least one next song
            const queue = client.player.nodes.get(interaction.guildId)
            if (!queue || !queue.tracks.toArray()[0]) return interaction.editReply(client.errors.EMPTY_QUEUE())
            const pages = createPages(queue)
            if (pages.length > 1)
                await pagination({
                    embeds: pages,
                    author: interaction.member.user,
                    interaction: interaction,
                    ephemeral: false,
                    time: 60000,
                    disableButtons: true,
                    fastSkip: true,
                    pageTravel: true,
                    buttons: [
                        {
                            value: ButtonTypes.previous,
                            label: 'Previous',
                            style: ButtonStyles.Secondary
                        },
                        {
                            value: ButtonTypes.next,
                            label: 'Next',
                            style: ButtonStyles.Primary
                        }
                    ]
                })
            else
                interaction.editReply({
                    embeds: [pages[0]]
                })
        }
    }
}
