import express from 'express';
import { AlbumReview } from '../models/AlbumReview.js';
import { User } from '../models/User.js';

const router = express.Router();

// Input validation helpers
const validateSpotifyId = (id) => {
  if (!id || typeof id !== 'string') return false;
  // Spotify IDs are alphanumeric with some special chars
  return /^[\w-]{1,50}$/.test(id);
};

const validateRating = (rating) => {
  return typeof rating === 'number' && rating >= 0 && rating <= 100;
};

const validateModifier = (modifier) => {
  return typeof modifier === 'number' && modifier >= -20 && modifier <= 20;
};

const sanitizeString = (str, maxLength = 5000) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

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

    // Validate required fields
    if (!validateSpotifyId(userSpotifyId)) {
      return res.status(400).json({ error: 'Invalid userSpotifyId format' });
    }
    if (!validateSpotifyId(albumId)) {
      return res.status(400).json({ error: 'Invalid albumId format' });
    }
    if (!validateRating(overallRating)) {
      return res.status(400).json({ error: 'overallRating must be between 0 and 100' });
    }

    // Validate optional ratings
    if (baseOverallRating !== undefined && !validateRating(baseOverallRating)) {
      return res.status(400).json({ error: 'baseOverallRating must be between 0 and 100' });
    }
    if (adjustedOverallRating !== undefined && !validateRating(adjustedOverallRating)) {
      return res.status(400).json({ error: 'adjustedOverallRating must be between 0 and 100' });
    }

    // Validate score modifiers
    if (scoreModifiers) {
      const modifierKeys = ['emotionalStoryConnection', 'cohesionAndFlow', 'artistIdentityOriginality', 'visualAestheticEcosystem'];
      for (const key of modifierKeys) {
        if (scoreModifiers[key] !== undefined && !validateModifier(scoreModifiers[key])) {
          return res.status(400).json({ error: `${key} must be between -20 and 20` });
        }
      }
    }

    // Validate and sanitize song ratings
    let validatedSongRatings = [];
    if (Array.isArray(songRatings)) {
      validatedSongRatings = songRatings
        .filter(sr => validateSpotifyId(sr.trackId) && typeof sr.rating === 'number' && sr.rating >= 0 && sr.rating <= 5)
        .map(sr => ({
          trackId: sr.trackId,
          trackName: sanitizeString(sr.trackName, 200),
          rating: sr.rating,
        }))
        .slice(0, 100); // Limit to 100 track ratings
    }

    // Sanitize text fields
    const sanitizedWriteup = sanitizeString(writeup, 10000);
    const sanitizedAlbumName = albumMeta?.name ? sanitizeString(albumMeta.name, 200) : undefined;
    const sanitizedAlbumImage = albumMeta?.image ? sanitizeString(albumMeta.image, 500) : undefined;

    // Validate and sanitize artists array
    let sanitizedArtists = [];
    if (Array.isArray(albumMeta?.artists)) {
      sanitizedArtists = albumMeta.artists
        .filter(a => typeof a === 'string')
        .map(a => sanitizeString(a, 100))
        .slice(0, 20); // Limit to 20 artists
    }

    const doc = await AlbumReview.findOneAndUpdate(
      { userSpotifyId, albumId },
      {
        $set: {
          overallRating,
          baseOverallRating,
          adjustedOverallRating,
          scoreModifiers,
          songRatings: validatedSongRatings,
          writeup: sanitizedWriteup,
          albumName: sanitizedAlbumName,
          albumArtists: sanitizedArtists,
          albumImage: sanitizedAlbumImage,
        },
      },
      { new: true, upsert: true }
    );

    res.json(doc);
  } catch (e) {
    console.error('save review error', e);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// Get all reviews for an album
router.get('/album/:albumId', async (req, res) => {
  try {
    if (!validateSpotifyId(req.params.albumId)) {
      return res.status(400).json({ error: 'Invalid albumId format' });
    }

    const reviews = await AlbumReview.find({ albumId: req.params.albumId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    // Populate user information
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findOne({ spotifyId: review.userSpotifyId });
        return {
          ...review,
          user: user ? { displayName: user.displayName, avatarUrl: user.avatarUrl } : null
        };
      })
    );
    
    res.json(reviewsWithUsers);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Get all reviews by a user (optionally filter by album)
router.get('/user/:spotifyId', async (req, res) => {
  try {
    if (!validateSpotifyId(req.params.spotifyId)) {
      return res.status(400).json({ error: 'Invalid spotifyId format' });
    }

    const { albumId } = req.query;
    const q = { userSpotifyId: req.params.spotifyId };
    
    if (albumId) {
      if (!validateSpotifyId(albumId)) {
        return res.status(400).json({ error: 'Invalid albumId format' });
      }
      q.albumId = albumId;
    }
    
    const reviews = await AlbumReview.find(q).sort({ updatedAt: -1 }).limit(200).lean();
    
    // Populate user information
    const user = await User.findOne({ spotifyId: req.params.spotifyId });
    const reviewsWithUser = reviews.map(review => ({
      ...review,
      user: user ? { displayName: user.displayName, avatarUrl: user.avatarUrl } : null
    }));
    
    res.json(reviewsWithUser);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Recent reviews feed
router.get('/', async (_req, res) => {
  try {
    const reviews = await AlbumReview.find({}).sort({ createdAt: -1 }).limit(200).lean();
    
    // Get all unique user IDs
    const userIds = [...new Set(reviews.map(r => r.userSpotifyId))];
    
    // Fetch all users in one query
    const users = await User.find({ spotifyId: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u.spotifyId, u]));
    
    // Attach user info to each review
    const reviewsWithUsers = reviews.map(review => {
      const user = userMap.get(review.userSpotifyId);
      return {
        ...review,
        user: user ? { displayName: user.displayName, avatarUrl: user.avatarUrl } : null
      };
    });
    
    res.json(reviewsWithUsers);
  } catch (e) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// Delete a review
router.delete('/:userSpotifyId/:albumId', async (req, res) => {
  try {
    const { userSpotifyId, albumId } = req.params;
    
    if (!validateSpotifyId(userSpotifyId)) {
      return res.status(400).json({ error: 'Invalid userSpotifyId format' });
    }
    if (!validateSpotifyId(albumId)) {
      return res.status(400).json({ error: 'Invalid albumId format' });
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
