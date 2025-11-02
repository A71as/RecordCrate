import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Create or update a user based on Spotify profile
router.post('/sync', async (req, res) => {
  try {
    const { spotifyId, displayName, avatarUrl } = req.body || {};
    if (!spotifyId) return res.status(400).json({ error: 'spotifyId required' });

    const update = { displayName, avatarUrl };
    const user = await User.findOneAndUpdate(
      { spotifyId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (e) {
    console.error('sync user error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/:spotifyId', async (req, res) => {
  try {
    const user = await User.findOne({ spotifyId: req.params.spotifyId });
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
