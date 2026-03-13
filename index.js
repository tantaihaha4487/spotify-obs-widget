const express = require("express");
const spotifyUtils = require("./utils/spotify.js");
require("dotenv").config();

const port = process.env.PORT || 8067;
const app = express();

function ensureHttps(uri) {
    if (uri && !uri.startsWith('http://') && !uri.startsWith('https://')) {
        return 'https://' + uri;
    }
    return uri;
}

app.get("/", (req, res) => {
    res.send(`
        <h1>Spotify Status Widget</h1>
        <a href="/login">Login with Spotify</a>
    `);
});

app.get("/login", (req, res) => {
    const state = spotifyUtils.generateRandomString(16);
    const scope = 'user-read-currently-playing user-read-playback-state';
    
    res.redirect('https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: process.env.SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: ensureHttps(process.env.SPOTIFY_REDIRECT_URI),
            state: state
        }));
});

app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;
    
    if (error) {
        return res.status(400).json({ error: 'Access denied' });
    }
    
    try {
        const tokenData = await spotifyUtils.exchangeCode(code);
        if (tokenData.error) {
            return res.status(500).json({ error: tokenData.error });
        }
        res.json({ 
            message: 'Login successful!',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/now-playing", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required. Please login first.' });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    try {
        const nowPlaying = await spotifyUtils.getNowPlaying(accessToken);
        res.json(nowPlaying);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});