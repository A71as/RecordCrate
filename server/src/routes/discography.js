import express from 'express';
import axios from 'axios';

const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET || '';
const DEFAULT_MARKET = 'US';

let appAccessToken = null;
let appAccessTokenExpiry = 0;

async function getAppAccessToken() {
  if (appAccessToken && Date.now() < appAccessTokenExpiry) return appAccessToken;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in server/.env');
  }
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  appAccessToken = resp.data.access_token;
  appAccessTokenExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000 - 30000; // 30s buffer
  return appAccessToken;
}

async function fetchArtistsGenres(artistIds) {
  const token = await getAppAccessToken();
  const map = new Map();
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50);
    try {
      const resp = await axios.get('https://api.spotify.com/v1/artists', {
        headers: { Authorization: `Bearer ${token}` },
        params: { ids: chunk.join(',') },
      });
      for (const artist of resp.data.artists || []) {
        if (artist?.id) map.set(artist.id, artist.genres || []);
      }
    } catch (e) {
      // continue
    }
  }
  return map;
}

router.get('/genres', async (_req, res) => {
  try {
    const token = await getAppAccessToken();
    const resp = await axios.get('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ genres: resp.data?.genres || [] });
  } catch (e) {
    console.error('[Discography] genres error', e?.response?.data || e.message);
    res.status(503).json({ error: 'failed_to_fetch_genres' });
  }
});

// Deprecated: This endpoint is not used by the frontend anymore
// The frontend uses /api/billboard/hot-100 instead
// Kept for backwards compatibility only
router.get('/top-tracks', async (_req, res) => {
  res.status(410).json({ 
    error: 'This endpoint is deprecated. Please use /api/billboard/hot-100 instead.',
    redirect: '/api/billboard/hot-100'
  });
});

export default router;
