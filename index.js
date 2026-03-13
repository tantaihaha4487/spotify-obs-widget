const express = require("express");
const path = require("path");
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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

app.get("/callback", (req, res) => {
    // Redirect cleanly to the static success page to handle tokens frontend-side
    const code = req.query.code || '';
    const error = req.query.error || '';
    
    if (error) {
        res.redirect(`/success.html?error=${encodeURIComponent(error)}`);
    } else {
        res.redirect(`/success.html?code=${encodeURIComponent(code)}`);
    }
});

app.get("/api/token-exchange", async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }
    
    try {
        const tokenData = await spotifyUtils.exchangeCode(code);
        if (tokenData.error) {
            return res.status(500).json({ error: tokenData.error });
        }
        res.json(tokenData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/now-playing", async (req, res) => {
    const refreshToken = req.query.refresh_token;
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }
    
    try {
        // Get a fresh access token using the refresh token
        const tokenData = await spotifyUtils.refreshToken(refreshToken);
        if (tokenData.error) {
             return res.status(401).json({ error: 'Failed to refresh token: ' + tokenData.error });
        }

        // Fetch now playing info using the fresh access token
        const nowPlaying = await spotifyUtils.getNowPlaying(tokenData.access_token);
        res.json(nowPlaying);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Export for Vercel serverless
module.exports = app;