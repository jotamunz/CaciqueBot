const { SlashCommandBuilder } = require('@discordjs/builders')
const playCmd = require('./play')
const lofiPlaylist = 'https://open.spotify.com/playlist/07G5QhRoBXDsoRTNE4Ljcp'

module.exports = {
    // Prefix command
    cmd: {
        name: 'lofi',
        inVoiceChannel: true,
        run: async (client, message) => {
            playCmd.cmd.run(client, message, [lofiPlaylist])
        }
    },
    // Slash command
    s_cmd: {
        data: new SlashCommandBuilder().setName('lofi').setDescription('Play lofi beats.'),
        async execute({ client, interaction }) {
            interaction.options._hoistedOptions.push({
                name: 'song',
                type: 3,
                value: lofiPlaylist
            })
            await playCmd.s_cmd.execute({ client, interaction })
        }
    }
}
