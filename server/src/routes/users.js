import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Input validation helpers
const validateSpotifyId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[\w-]{1,50}$/.test(id);
};

const sanitizeString = (str, maxLength = 200) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Create or update a user based on Spotify profile
router.post('/sync', async (req, res) => {
  try {
    const { spotifyId, displayName, avatarUrl } = req.body || {};
    
    if (!validateSpotifyId(spotifyId)) {
      return res.status(400).json({ error: 'Invalid spotifyId format' });
    }

    const update = {
      displayName: sanitizeString(displayName, 100),
    };

    // Only set avatarUrl if it's a valid URL
    if (avatarUrl && validateUrl(avatarUrl)) {
      update.avatarUrl = sanitizeString(avatarUrl, 500);
    }

    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (e) {
    console.error('sync user error', e);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

router.get('/:spotifyId', async (req, res) => {
  try {
    if (!validateSpotifyId(req.params.spotifyId)) {
      return res.status(400).json({ error: 'Invalid spotifyId format' });
    }
    
    const user = await User.findOne({ spotifyId: req.params.spotifyId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error('get user error', e);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user preferences
router.patch('/:spotifyId/preferences', async (req, res) => {
  try {
    if (!validateSpotifyId(req.params.spotifyId)) {
      return res.status(400).json({ error: 'Invalid spotifyId format' });
    }

    const { displayAsAnonymous } = req.body || {};
    
    if (displayAsAnonymous !== undefined && typeof displayAsAnonymous !== 'boolean') {
      return res.status(400).json({ error: 'displayAsAnonymous must be a boolean' });
    }

    const update = {};
    if (displayAsAnonymous !== undefined) {
      update.displayAsAnonymous = displayAsAnonymous;
    }

    // Use upsert to create user if doesn't exist
    const user = await User.findOneAndUpdate(
      { spotifyId: req.params.spotifyId },
      { $set: update },
      { new: true, upsert: true }
    );

    console.log('User preferences updated:', { spotifyId: req.params.spotifyId, update, user });
    res.json(user);
  } catch (e) {
    console.error('update user preferences error', e);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
