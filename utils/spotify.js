require('dotenv').config();
const crypto = require('crypto');
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;

function ensureHttps(uri) {
    if (uri && !uri.startsWith('http://') && !uri.startsWith('https://')) {
        return 'https://' + uri;
    }
    return uri;
}

function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
}

async function exchangeCode(code) {
    try {
        const redirectUri = ensureHttps(SPOTIFY_REDIRECT_URI);
        console.log('Token exchange - redirect_uri:', redirectUri);
        console.log('Token exchange - client_id present:', !!SPOTIFY_CLIENT_ID);
        console.log('Token exchange - client_secret present:', !!SPOTIFY_CLIENT_SECRET);
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirectUri
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Spotify token error:', JSON.stringify(data));
            return { error: data.error_description || data.error || 'Failed to exchange code for token' };
        }
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in
        };
    } catch (error) {
        console.error('Exchange code exception:', error);
        return { error: error.message };
    }
}

async function refreshToken(refreshToken) {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Spotify refresh token error:', JSON.stringify(data));
            return { error: data.error_description || data.error || 'Failed to refresh token' };
        }
        return { access_token: data.access_token };
    } catch (error) {
        console.error('Refresh token exception:', error);
        return { error: error.message };
    }
}

async function getNowPlaying(accessToken) {
    try {
        console.log('getNowPlaying - token starts with:', accessToken?.substring(0, 10));
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('getNowPlaying - status:', response.status);
        if (response.status === 204) {
            return { isPlaying: false };
        }
        if (!response.ok) {
            let errorBody = '';
            try { errorBody = await response.text(); } catch(e) {}
            console.error('getNowPlaying error:', response.status, errorBody);
            return { error: `Spotify API ${response.status}: ${errorBody}` };
        }
        const data = await response.json();
        return {
            isPlaying: data.is_playing,
            track: data.item?.name,
            artist: data.item?.artists?.map(a => a.name).join(', '),
            album: data.item?.album?.name,
            albumImage: data.item?.album?.images?.[0]?.url,
            progress: data.progress_ms,
            duration: data.item?.duration_ms
        };
    } catch (error) {
        console.error('getNowPlaying exception:', error);
        return { error: error.message };
    }
}

module.exports = {
    generateRandomString,
    exchangeCode,
    refreshToken,
    getNowPlaying
};