import express from 'express';
import { AlbumReview } from '../models/AlbumReview.js';
import { geminiService } from '../services/gemini.js';

const router = express.Router();

/**
 * Get daily AI album recommendation for a user
 * GET /api/daily-recommendation/:userId
 * 
 * Returns:
 * - album: The recommended album for today
 * - reason: Why this album was recommended
 * - date: The date string (YYYY-MM-DD)
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];

    // Fetch user's review history from the database
    const userReviews = await AlbumReview.find({ userSpotifyId: userId })
      .sort({ createdAt: -1 })
      .limit(50) // Get last 50 reviews for analysis
      .lean();

    // Analyze user preferences
    const preferences = analyzeUserPreferences(userReviews);

    // Generate AI recommendation using Gemini
    const recommendation = await generateDailyRecommendation(preferences, dateKey);

    res.json({
      album: recommendation.album,
      reason: recommendation.reason,
      date: dateKey,
      userId
    });

  } catch (error) {
    console.error('Error generating daily recommendation:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendation',
      message: error.message 
    });
  }
});

/**
 * Analyze user's review history to extract preferences
 */
function analyzeUserPreferences(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      favoriteArtists: [],
      averageRating: 0,
      topGenres: [],
      recentAlbums: [],
      hasHistory: false
    };
  }

  // Extract favorite artists (artists with highest average ratings)
  const artistRatings = {};
  const albumNames = [];
  
  reviews.forEach(review => {
    if (review.albumArtists && Array.isArray(review.albumArtists)) {
      review.albumArtists.forEach(artist => {
        if (!artistRatings[artist]) {
          artistRatings[artist] = { total: 0, count: 0 };
        }
        artistRatings[artist].total += review.overallRating || 0;
        artistRatings[artist].count += 1;
      });
    }
    if (review.albumName) {
      albumNames.push(review.albumName);
    }
  });

  // Calculate average ratings for artists
  const favoriteArtists = Object.entries(artistRatings)
    .map(([artist, data]) => ({
      name: artist,
      avgRating: data.total / data.count,
      reviewCount: data.count
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10)
    .map(a => a.name);

  // Calculate overall average rating
  const totalRating = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
  const averageRating = totalRating / reviews.length;

  return {
    favoriteArtists,
    averageRating,
    topGenres: [], // Could be enhanced with genre data
    recentAlbums: albumNames.slice(0, 10),
    hasHistory: true
  };
}

/**
 * Generate daily recommendation using Gemini AI
 */
async function generateDailyRecommendation(preferences, dateKey) {
  // If Gemini is not configured or user has no history, return fallback
  if (!geminiService.isConfigured || !preferences.hasHistory) {
    return getFallbackRecommendation(dateKey);
  }

  try {
    // Create a prompt for Gemini based on user preferences
    const prompt = `
You are a music recommendation AI tasked with providing a daily album recommendation.

User's listening preferences:
- Favorite Artists: ${preferences.favoriteArtists.slice(0, 5).join(', ') || 'None yet'}
- Average Rating: ${preferences.averageRating.toFixed(1)}/100
- Recent Albums: ${preferences.recentAlbums.slice(0, 5).join(', ') || 'None yet'}

Provide ONE excellent album recommendation that:
1. Matches the user's taste based on their favorite artists
2. Is NOT one of their recent albums
3. Offers either a similar style OR an interesting discovery
4. Is a real, popular album available on Spotify

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "albumName": "Album Title",
  "artistName": "Artist Name",
  "reason": "A personalized 1-2 sentence explanation of why this album fits their taste",
  "spotifySearchQuery": "album:Album Title artist:Artist Name"
}
`;

    const model = geminiService.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      console.error('Empty response from Gemini');
      return getFallbackRecommendation(dateKey);
    }

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const aiResponse = JSON.parse(cleanedText);

    return {
      album: {
        name: aiResponse.albumName,
        artist: aiResponse.artistName,
        searchQuery: aiResponse.spotifySearchQuery
      },
      reason: aiResponse.reason,
      date: dateKey
    };

  } catch (error) {
    console.error('Error calling Gemini for daily recommendation:', error);
    return getFallbackRecommendation(dateKey);
  }
}

/**
 * Fallback recommendation when AI is unavailable or user has no history
 */
function getFallbackRecommendation(dateKey) {
  // Use date as seed for consistent daily recommendations
  const dayOfYear = Math.floor((new Date(dateKey) - new Date(new Date(dateKey).getFullYear(), 0, 0)) / 86400000);
  
  const fallbackAlbums = [
    { name: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', reason: 'A modern hip-hop classic with compelling storytelling and production.' },
    { name: 'Abbey Road', artist: 'The Beatles', reason: 'One of the most influential albums in music history with timeless melodies.' },
    { name: 'Blonde', artist: 'Frank Ocean', reason: 'A genre-defying masterpiece blending R&B, soul, and experimental sounds.' },
    { name: 'Rumours', artist: 'Fleetwood Mac', reason: 'Iconic soft rock with unforgettable hooks and emotional depth.' },
    { name: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', reason: 'A bold, jazz-influenced hip-hop album addressing social issues.' },
    { name: 'Thriller', artist: 'Michael Jackson', reason: 'The best-selling album of all time with groundbreaking pop production.' },
    { name: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', reason: 'A soulful blend of hip-hop, R&B, and reggae with powerful lyrics.' },
    { name: 'Dark Side of the Moon', artist: 'Pink Floyd', reason: 'Progressive rock masterpiece known for its sonic innovation and thematic depth.' },
    { name: 'Kid A', artist: 'Radiohead', reason: 'An experimental, electronic-influenced album that redefined alternative rock.' },
    { name: 'Songs in the Key of Life', artist: 'Stevie Wonder', reason: 'A double album showcasing soul, funk, and jazz at its finest.' }
  ];

  const index = dayOfYear % fallbackAlbums.length;
  const selected = fallbackAlbums[index];

  return {
    album: {
      name: selected.name,
      artist: selected.artist,
      searchQuery: `album:${selected.name} artist:${selected.artist}`
    },
    reason: selected.reason,
    date: dateKey
  };
}

export default router;
