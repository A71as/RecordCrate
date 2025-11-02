import express from 'express';
import { AlbumReview } from '../models/AlbumReview.js';

const router = express.Router();

// Upsert a review for a user+album
router.post('/', async (req, res) => {
  try {
    const {
      userSpotifyId,
      albumId,
      overallRating,
      baseOverallRating,
      adjustedOverallRating,
      scoreModifiers,
      songRatings,
      writeup,
      albumMeta,
    } = req.body || {};

    if (!userSpotifyId) return res.status(400).json({ error: 'userSpotifyId required' });
    if (!albumId) return res.status(400).json({ error: 'albumId required' });
    if (typeof overallRating !== 'number') return res.status(400).json({ error: 'overallRating required' });

    const doc = await AlbumReview.findOneAndUpdate(
      { userSpotifyId, albumId },
      {
        $set: {
          overallRating,
          baseOverallRating,
          adjustedOverallRating,
          scoreModifiers,
          songRatings,
          writeup,
          albumName: albumMeta?.name,
          albumArtists: albumMeta?.artists || [],
          albumImage: albumMeta?.image,
        },
      },
      { new: true, upsert: true }
    );

    res.json(doc);
  } catch (e) {
    console.error('save review error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Get all reviews for an album
router.get('/album/:albumId', async (req, res) => {
  try {
    const list = await AlbumReview.find({ albumId: req.params.albumId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Get all reviews by a user (optionally filter by album)
router.get('/user/:spotifyId', async (req, res) => {
  try {
    const { albumId } = req.query;
    const q = { userSpotifyId: req.params.spotifyId };
    if (albumId) q.albumId = albumId;
    const list = await AlbumReview.find(q).sort({ updatedAt: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Recent reviews feed
router.get('/', async (_req, res) => {
  try {
    const list = await AlbumReview.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Delete a review
router.delete('/:userSpotifyId/:albumId', async (req, res) => {
  try {
    const { userSpotifyId, albumId } = req.params;
    
    if (!userSpotifyId || !albumId) {
      return res.status(400).json({ error: 'userSpotifyId and albumId required' });
    }

    const result = await AlbumReview.findOneAndDelete({ userSpotifyId, albumId });
    
    if (!result) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully', deletedReview: result });
  } catch (e) {
    console.error('delete review error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
