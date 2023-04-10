const { SlashCommandBuilder } = require('@discordjs/builders')
const { EmbedBuilder } = require('discord.js')
const colors = require('../colors.json')

module.exports = {
    // Prefix command
    cmd: {
        name: 'help',
        aliases: ['h'],
        run: async (client, message) => {
            message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Commands')
                        .setDescription(client.commands.map(cmd => `\`${cmd.name}\``).join(', '))
                        .setColor(colors.actionStatus)
                ]
            })
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('help').setDescription('Show a list of available commands.'),
        async execute({ client, interaction }) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Commands')
                        .setDescription(client.commands.map(cmd => `\`${cmd.name}\``).join(', '))
                        .setColor(colors.actionStatus)
                ]
            })
        }
    }
}
