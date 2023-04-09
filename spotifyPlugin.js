/*
 * This is a special script used to bypass
 * the 100 track size limit on playlists
 * and albums in Discord-Player.
 * Setup requires manipulation of
 * node modules.
 */

'use strict'
var __create = Object.create
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getProtoOf = Object.getPrototypeOf
var __hasOwnProp = Object.prototype.hasOwnProperty
var __defNormalProp = (obj, key, value) =>
    key in obj
        ? __defProp(obj, key, {
              enumerable: true,
              configurable: true,
              writable: true,
              value
          })
        : (obj[key] = value)
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true })
var __copyProps = (to, from, except, desc) => {
    if ((from && typeof from === 'object') || typeof from === 'function') {
        for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
                __defProp(to, key, {
                    get: () => from[key],
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
                })
    }
    return to
}
var __toESM = (mod, isNodeMode, target) => (
    (target = mod != null ? __create(__getProtoOf(mod)) : {}),
    __copyProps(
        isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
        mod
    )
)
var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value)
    return value
}
var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj)) throw TypeError('Cannot ' + msg)
}
var __privateAdd = (obj, member, value) => {
    if (member.has(obj)) throw TypeError('Cannot add the same private member more than once')
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value)
}
var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, 'access private method')
    return method
}

var import_spotify_url_info = __toESM(require('spotify-url-info'))
var import_spotify_web_api_node = __toESM(require('spotify-web-api-node'))
var import_undici = require('undici')
var import_spotify_uri = require('spotify-uri')
var SUPPORTED_TYPES = ['album', 'playlist', 'track', 'artist']
var api = new import_spotify_web_api_node.default()
var info = (0, import_spotify_url_info.default)(import_undici.fetch)
var firstWarning1 = true
var firstWarning2 = true
var _getFullItems, getFullItems_fn

var API = class {
    constructor(clientId, clientSecret, topTracksCountry) {
        __privateAdd(this, _getFullItems)
        __publicField(this, '_hasCredentials', false)
        __publicField(this, '_expirationTime', 0)
        __publicField(this, '_tokenAvailable', false)
        __publicField(this, 'topTracksCountry', 'US')
        if (clientId && clientSecret) {
            this._hasCredentials = true
            api.setClientId(clientId)
            api.setClientSecret(clientSecret)
        }
        if (topTracksCountry) {
            if (!/^[A-Z]{2}$/.test(topTracksCountry)) throw new Error('Invalid region code')
            this.topTracksCountry = topTracksCountry
        }
    }
    isSupportedTypes(type) {
        return SUPPORTED_TYPES.includes(type)
    }
    async refreshToken() {
        if (Date.now() < this._expirationTime) return
        if (this._hasCredentials) {
            try {
                const { body } = await api.clientCredentialsGrant()
                api.setAccessToken(body.access_token)
                this._expirationTime = Date.now() + body.expires_in * 1e3 - 5e3
            } catch (e) {
                if (firstWarning1) {
                    firstWarning1 = false
                    this._hasCredentials = false
                    console.warn(e)
                    console.warn(
                        '[SPOTIFY_PLUGIN_API] Cannot get token from your credentials. Try scraping token instead.'
                    )
                }
            }
        }
        if (!this._hasCredentials) {
            const response = await (0, import_undici.fetch)('https://open.spotify.com/')
            const body = await response.text()
            const token = body.match(/"accessToken":"(.+?)"/)?.[1]
            if (!token) {
                this._tokenAvailable = false
                if (firstWarning2) {
                    firstWarning2 = false
                    console.warn(
                        '[SPOTIFY_PLUGIN_API] Cannot get token from scraping. Cannot fetch more than 100 tracks from a playlist or album.'
                    )
                }
                return
            }
            api.setAccessToken(token)
            const expiration = body.match(/"accessTokenExpirationTimestampMs":(\d+)/)?.[1]
            if (expiration) this._expirationTime = Number(expiration) - 5e3
        }
        this._tokenAvailable = true
    }
    parseUrl(url) {
        return (0, import_spotify_uri.parse)(url)
    }
    async getData(url) {
        const parsedUrl = this.parseUrl(url)
        const id = parsedUrl.id
        if (!id) throw new Error('SPOTIFY_API_INVALID_URL')
        if (!this.isSupportedTypes(parsedUrl.type)) {
            throw new Error('SPOTIFY_API_UNSUPPORTED_TYPE')
        }
        await this.refreshToken()
        if (parsedUrl.type === 'track') {
            if (!this._tokenAvailable) return info.getData(url)
            return api
                .getTrack(id)
                .then(({ body }) => body)
                .catch(e => {
                    throw apiError(e)
                })
        }
        if (!this._tokenAvailable) {
            const data = await info.getData(url)
            return {
                type: parsedUrl.type,
                name: data.title,
                thumbnail: data.coverArt?.sources?.[0]?.url,
                url,
                tracks: data.trackList.map(i => ({
                    type: 'track',
                    name: i.title,
                    artists: [{ name: i.subtitle }]
                }))
            }
        }
        let name, thumbnail, tracks, desc, author
        try {
            switch (parsedUrl.type) {
                case 'album': {
                    const { body } = await api.getAlbum(id)
                    name = body.name
                    thumbnail = body.images?.[0]?.url
                    url = body.external_urls?.spotify
                    desc = body.label
                    author = body.artists?.[0]?.name
                    tracks = await __privateMethod(this, _getFullItems, getFullItems_fn).call(this, body)
                    break
                }
                case 'playlist': {
                    const { body } = await api.getPlaylist(id)
                    name = body.name
                    thumbnail = body.images?.[0]?.url
                    url = body.external_urls?.spotify
                    desc = body.description
                    author = body.owner?.display_name
                    tracks = (await __privateMethod(this, _getFullItems, getFullItems_fn).call(this, body)).map(
                        i => i.track
                    )
                    break
                }
                case 'artist': {
                    const { body } = await api.getArtist(id)
                    name = body.name
                    thumbnail = body.images?.[0]?.url
                    url = body.external_urls?.spotify
                    desc = ''
                    author = body.name
                    tracks = (await api.getArtistTopTracks(id, this.topTracksCountry)).body.tracks
                    break
                }
            }
        } catch (e) {
            throw new Error(e)
        }
        return {
            type: parsedUrl.type,
            name,
            thumbnail,
            url,
            desc,
            author,
            tracks: tracks.filter(t => t?.type === 'track')
        }
    }
}
__name(API, 'API')
_getFullItems = new WeakSet()
getFullItems_fn = /* @__PURE__ */ __name(async function (data) {
    const items = data.tracks.items
    const isPlaylist = data.type === 'playlist'
    const limit = isPlaylist ? 100 : 50
    const method = isPlaylist ? 'getPlaylistTracks' : 'getAlbumTracks'
    while (data.tracks.next) {
        await this.refreshToken()
        data.tracks = (
            await api[method](data.id, {
                offset: data.tracks.offset + data.tracks.limit,
                limit
            })
        ).body
        items.push(...data.tracks.items)
    }
    return items
}, '#getFullItems')

module.exports = { SpotifyAPI: API }
