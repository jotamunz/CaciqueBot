const { EmbedBuilder } = require('discord.js')
const colors = require('./colors.json')

// Get a formatted volume string with a speaker emoji according to the volume.
function getVolumeFormat(vol) {
    let vol_emote = ':speaker:'
    if (vol == 0) vol_emote = ':mute:'
    if (0 < vol && vol <= 30) vol_emote = ':speaker:'
    if (30 < vol && vol <= 60) vol_emote = ':sound:'
    if (60 < vol && vol <= 100) vol_emote = ':loud_sound:'

    return `${vol_emote} ${vol}%`
}

// Get an emoji according to the loop status of the queue.
function getRepeatModeFormat(repeatMode) {
    switch (repeatMode) {
        case 0:
            return ''
        case 1:
            return ':repeat_one:'
        case 2:
            return ':repeat:'
        case 3:
            return ':infinity:'
    }
}

// Get the embed for the song that is currently playing in the queue.
function getPlayEmbed(queue, song) {
    let fullMsg = ''
    let formattedVolume = getVolumeFormat(queue.options.volume)
    let repeatMode = getRepeatModeFormat(queue.repeatMode)
    //TODO: Add filters
    let filters = ''
    let embed = new EmbedBuilder()
        .setColor(colors.actionStatus)
        .setTitle('Now Playing')
        .setDescription(`**[${song.title}](${song.url})** - \`${song.duration}\``)
        .setThumbnail(song.thumbnail)
        .addFields({ name: ' ', value: `Artist: ${song.author}` })
        .addFields({
            name: ' ',
            value: `Requested by: <@${song.requestedBy.id}>`
        })

    fullMsg = fullMsg.concat(formattedVolume)
    if (repeatMode != '') fullMsg = fullMsg.concat(' ', repeatMode)
    embed.addFields({ name: fullMsg, value: ' ', inline: true })
    return embed
}

// Get an embed for an action failure
function getFailureEmbed(message) {
    let embed = new EmbedBuilder()
        .setColor(colors.actionFailure)
        .setTitle('Unable to execute the command.')
        .setDescription(message)
    return embed
}

// Get an embed for an action success
function getSuccessEmbed(message) {
    let embed = new EmbedBuilder().setColor(colors.actionSuccess).setDescription(message)
    return embed
}

// Get an embed for an unexpected error
function getErrorEmbed(title, message) {
    let embed = new EmbedBuilder().setColor(colors.actionFailure).setTitle(title)
    if (message !== '') embed.setDescription(message)
    return embed
}

function getQueuedSongEmbed(song) {
    let embed = new EmbedBuilder()
        .setColor(colors.actionSuccess)
        .setTitle('Queued')
        .setDescription(`**[${song.title}](${song.url})** - \`${song.duration}\``)
        .setThumbnail(song.thumbnail)
        .addFields({ name: ' ', value: `Artist: ${song.author}` })
        .addFields({ name: ' ', value: `Requested by: <@${song.requestedBy.id}>` })
    // TODO: Add queue position
    return embed
}

function getQueuedPlaylistEmbed(songs) {
    const playlist = songs[0].playlist
    let embed = new EmbedBuilder()
        .setColor(colors.actionSuccess)
        .setTitle('Queued')
        .setDescription(`**[${playlist.title}](${playlist.url})** - \`${songs.length} songs\``)
        .setThumbnail(playlist.thumbnail.url ?? playlist.thumbnail)
        .addFields({ name: ' ', value: `Curator: ${playlist.author.name}` })
        .addFields({ name: ' ', value: `Requested by: <@${songs[0].requestedBy.id}>` })
    // TODO: Add queue position
    return embed
}

// Gets a time string formatted as mm:ss or hh:mm:ss and returns the amount of seconds as a number.
function getSecondsFromString(string) {
    var p = string.split(':'),
        s = 0,
        m = 1

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10)
        m *= 60
    }

    return s
}

// Validate if a string follows the MM:SS format, with optional leading zeroes.
function validateMmSs(string) {
    var pattern = /^(?:[0-5]|[01]?[0-9]):[0-5][0-9]$/
    if (pattern.test(string)) return true
    return false
}

// Validate if a string follows the HH:MM:SS format, with optional leading zeroes.
function validateHhMmSs(string) {
    var pattern = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/
    if (pattern.test(string)) return true
    return false
}

module.exports = {
    getPlayEmbed: getPlayEmbed,
    getFailureEmbed: getFailureEmbed,
    getVolumeFormat: getVolumeFormat,
    getSuccessEmbed: getSuccessEmbed,
    getErrorEmbed: getErrorEmbed,
    getQueuedSongEmbed: getQueuedSongEmbed,
    getQueuedPlaylistEmbed: getQueuedPlaylistEmbed,
    getSecondsFromString: getSecondsFromString,
    validateMmSs: validateMmSs,
    validateHhMmSs: validateHhMmSs
}
