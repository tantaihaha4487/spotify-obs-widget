# Spotify OBS Widget

A lightweight Spotify "Now Playing" widget for OBS Studio. Shows the current track, artist, album art, and a progress bar as a stream overlay.

---

## Prerequisites

- **Spotify Premium** account (required by Spotify's Web API for the currently-playing endpoint)
- **Node.js** v18+
- A **Vercel** account (for deployment) — or any Node.js hosting
- An **OBS Studio** setup

---

## 1. Spotify App Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in the app details:
   - **App Name**: e.g. `OBS Widget`
   - **Redirect URI**: `https://<your-vercel-domain>/callback` (e.g. `https://spotify-obs-widget.vercel.app/callback`)
   - **APIs used**: Check **Web API**
4. Click **Save**
5. Go to **Settings** and note your **Client ID** and **Client Secret**

---

## 2. Environment Variables

Create a `.env` file in the project root (or set these in your Vercel dashboard):

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.vercel.app/callback
```

> **Important:** The `SPOTIFY_REDIRECT_URI` must include `https://` and must **exactly match** the Redirect URI you registered in the Spotify Developer Dashboard.

---

## 3. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the three environment variables above in **Settings → Environment Variables**
4. Deploy

---

## 4. User Flow

### Step 1: Login
Open your deployed app (e.g. `https://spotify-obs-widget.vercel.app`). You'll see the login page:

- Click **"Login with Spotify"**
- Authorize the app on Spotify's login screen

### Step 2: Get Your Widget URL
After authorizing, you'll be redirected to the **Success** page which displays your personal widget URL. It looks like:

```
https://spotify-obs-widget.vercel.app/widget.html?refresh_token=AQD...
```

- Click **"Copy URL"** to copy it to your clipboard

### Step 3: Add to OBS
1. Open **OBS Studio**
2. In your scene, click **+** under Sources → **Browser**
3. Paste the copied URL
4. Set dimensions to **400 × 120** (recommended)
5. ✅ Check **"Shutdown source when not visible"** (optional, saves API calls)
6. Click **OK**

The widget will now show your currently playing Spotify track on stream!

---

## Local Development

```bash
npm install
node index.js
# Server runs on http://localhost:8067
```

For local testing, set `SPOTIFY_REDIRECT_URI=http://localhost:8067/callback` in `.env` and add the same URI in your Spotify app settings.

---

## Project Structure

```
├── index.js              # Express server (API routes + auth)
├── utils/
│   └── spotify.js        # Spotify API helper functions
├── public/
│   ├── index.html        # Login page
│   ├── success.html      # Post-login page with copyable widget URL
│   ├── widget.html       # OBS overlay widget
│   └── style.css         # Shared styles
├── vercel.json           # Vercel deployment config
└── .env                  # Environment variables (not committed)
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Illegal redirect_uri` | Redirect URI missing `https://` | Ensure `SPOTIFY_REDIRECT_URI` starts with `https://` |
| `INVALID_CLIENT: Invalid redirect URI` | URI not registered in Spotify Dashboard | Add the exact URI in Spotify App → Settings → Redirect URIs |
| `403: Active premium subscription required` | App owner needs Spotify Premium | Subscribe to Spotify Premium; may take a few hours to propagate |
| Widget shows nothing | No song playing, or token expired | Play a song on Spotify and refresh the widget |
