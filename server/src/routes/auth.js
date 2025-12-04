/**
 * Secure Spotify OAuth routes
 * Handles token exchange on the backend to keep client secrets secure
 */
import express from 'express';
import axios from 'axios';

const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn('[Auth] Spotify credentials not configured. OAuth will not work.');
}

/**
 * Get client credentials token (for public API access)
 * POST /api/auth/spotify/client-token
 */
router.post('/spotify/client-token', async (req, res) => {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    console.error('[Auth] Client token error:', error);
    res.status(500).json({ error: 'Failed to get client token' });
  }
});

/**
 * Exchange authorization code for access token
 * POST /api/auth/spotify/token
 * Body: { code: string, redirectUri: string }
 */
router.post('/spotify/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'code and redirectUri are required' });
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      console.error('[Auth] Token exchange error:', data || error.message);
      
      if (data?.error === 'invalid_grant') {
        return res.status(400).json({ 
          error: 'Invalid authorization code or redirect URI' 
        });
      }
    }
    
    console.error('[Auth] Token exchange failed:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

/**
 * Refresh access token
 * POST /api/auth/spotify/refresh
 * Body: { refreshToken: string }
 */
router.post('/spotify/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refreshToken,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Auth] Token refresh error:', error.response?.data || error.message);
    } else {
      console.error('[Auth] Token refresh failed:', error);
    }
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
