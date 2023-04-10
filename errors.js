const { getFailureEmbed, getErrorEmbed } = require('./utils')

module.exports = {
    DEFAULT_ERROR: function () {
        const error = 'An unexpected error has occurred'
        return { embeds: [getErrorEmbed('Error', error)] }
    },
    NO_VOICE_CHANNEL: function () {
        const error = ':no_entry_sign: You need to be in a voice channel to play a song.'
        return { embeds: [getFailureEmbed(error)] }
    },
    NO_RESULT: function (query) {
        const error = `:no_entry_sign: No result found for \`${query}\`.`
        return { embeds: [getFailureEmbed(error)] }
    },
    NO_QUERY: function () {
        const error = ':no_entry_sign: Please enter a song url or query to search.'
        return { embeds: [getFailureEmbed(error)] }
    },
    EMPTY_QUEUE: function () {
        const error = ':no_entry_sign: There is nothing in the queue right now.'
        return { embeds: [getFailureEmbed(error)] }
    }
}
