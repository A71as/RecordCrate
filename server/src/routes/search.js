import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET || '';

let appAccessToken = null;
let appAccessTokenExpiry = 0;

class GeminiNaturalLanguageService {
  constructor() {
    this.genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
  }

  isAvailable() {
    return this.genAI !== null && GEMINI_API_KEY !== undefined;
  }

  async parseNaturalLanguageQuery(query) {
    if (!this.isAvailable()) {
      return this.basicParseQuery(query);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Parse this natural language music search query and extract structured information:
        
        Query: "${query}"
        
        Please respond with JSON in this exact format:
        {
          "type": "album|artist|track|mixed",
          "searchTerms": ["main search terms"],
          "genres": ["genre1", "genre2"] or null,
          "decades": ["2010s", "2000s"] or null,
          "mood": ["sad", "upbeat", "chill"] or null,
          "similarTo": "artist or album name" or null,
          "description": "brief description of what user wants"
        }

        Examples:
        - "albums like Blonde by Frank Ocean" → {"type": "album", "searchTerms": ["blonde", "frank ocean"], "similarTo": "Frank Ocean - Blonde", "description": "albums similar to Blonde by Frank Ocean"}
        - "sad indie music from the 2010s" → {"type": "mixed", "searchTerms": ["indie"], "genres": ["indie"], "decades": ["2010s"], "mood": ["sad"], "description": "sad indie music from 2010s"}
        - "Taylor Swift albums" → {"type": "album", "searchTerms": ["taylor swift"], "description": "Taylor Swift albums"}
        - "upbeat pop songs" → {"type": "track", "searchTerms": ["pop"], "genres": ["pop"], "mood": ["upbeat"], "description": "upbeat pop songs"}

        Focus on extracting:
        1. What type of music content (album, artist, track, or mixed)
        2. Key search terms (artist names, album names, etc.)
        3. Musical genres mentioned
        4. Time periods (convert to decades like "2010s", "2000s", "1990s")
        5. Mood/emotional descriptors
        6. "Similar to" or "like" references
        7. Overall intent

        Return only valid JSON, no other text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return this.validateAndCleanMusicQuery(parsed);
      } catch (parseError) {
        console.warn('Failed to parse Gemini response as JSON:', text);
        return this.basicParseQuery(query);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.basicParseQuery(query);
    }
  }

  basicParseQuery(query) {
    const lowercaseQuery = query.toLowerCase();
    
    const genres = ['pop', 'rock', 'hip-hop', 'rap', 'indie', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'soul', 'funk', 'blues', 'folk', 'punk', 'metal', 'alternative'];
    const moods = ['sad', 'happy', 'upbeat', 'chill', 'energetic', 'mellow', 'dark', 'bright', 'emotional', 'calm', 'intense'];
    const decades = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s'];
    
    const foundGenres = genres.filter(genre => lowercaseQuery.includes(genre));
    const foundMoods = moods.filter(mood => lowercaseQuery.includes(mood));
    const foundDecades = decades.filter(decade => {
      const year = decade.slice(0, 4);
      return lowercaseQuery.includes(decade) || lowercaseQuery.includes(year) || lowercaseQuery.includes(year.slice(2, 4) + 's');
    });

    let type = 'mixed';
    if (lowercaseQuery.includes('album') || lowercaseQuery.includes('albums')) {
      type = 'album';
    } else if (lowercaseQuery.includes('artist') || lowercaseQuery.includes('artists')) {
      type = 'artist';
    } else if (lowercaseQuery.includes('song') || lowercaseQuery.includes('songs') || lowercaseQuery.includes('track') || lowercaseQuery.includes('tracks')) {
      type = 'track';
    }

    let similarTo = null;
    const likeMatch = lowercaseQuery.match(/like (.+?)(?:\s|$)/);
    const similarMatch = lowercaseQuery.match(/similar to (.+?)(?:\s|$)/);
    if (likeMatch) {
      similarTo = likeMatch[1];
    } else if (similarMatch) {
      similarTo = similarMatch[1];
    }

    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'like', 'similar', 'albums', 'artists', 'songs', 'tracks', 'music', 'from'];
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word) && !foundGenres.includes(word) && !foundMoods.includes(word))
      .slice(0, 5);

    return {
      type,
      searchTerms,
      genres: foundGenres.length > 0 ? foundGenres : null,
      decades: foundDecades.length > 0 ? foundDecades : null,
      mood: foundMoods.length > 0 ? foundMoods : null,
      similarTo: similarTo || null,
      description: query
    };
  }

  validateAndCleanMusicQuery(query) {
    return {
      type: ['album', 'artist', 'track', 'mixed'].includes(query.type) ? query.type : 'mixed',
      searchTerms: Array.isArray(query.searchTerms) ? query.searchTerms.slice(0, 5) : [query.searchTerms || ''].filter(Boolean),
      genres: Array.isArray(query.genres) && query.genres.length > 0 ? query.genres : null,
      decades: Array.isArray(query.decades) && query.decades.length > 0 ? query.decades : null,
      mood: Array.isArray(query.mood) && query.mood.length > 0 ? query.mood : null,
      similarTo: typeof query.similarTo === 'string' ? query.similarTo : null,
      description: typeof query.description === 'string' ? query.description : query.searchTerms?.join(' ') || ''
    };
  }

  generateSpotifyQuery(musicQuery) {
    const parts = [];

    if (musicQuery.searchTerms.length > 0) {
      parts.push(musicQuery.searchTerms.join(' '));
    }

    if (musicQuery.genres && musicQuery.genres.length > 0) {
      musicQuery.genres.forEach(genre => {
        parts.push(`genre:"${genre}"`);
      });
    }

    if (musicQuery.decades && musicQuery.decades.length > 0) {
      const years = musicQuery.decades.map(decade => {
        const startYear = parseInt(decade.slice(0, 4));
        return `year:${startYear}-${startYear + 9}`;
      });
      parts.push(`(${years.join(' OR ')})`);
    }

    if (musicQuery.similarTo) {
      parts.unshift(musicQuery.similarTo);
    }

    return parts.join(' ').trim() || 'popular';
  }
}

async function getAppAccessToken() {
  if (appAccessToken && Date.now() < appAccessTokenExpiry) return appAccessToken;
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Missing Spotify credentials');
  }
  
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  
  appAccessToken = response.data.access_token;
  appAccessTokenExpiry = Date.now() + (response.data.expires_in || 3600) * 1000 - 30000;
  return appAccessToken;
}

async function searchSpotify(query, type = 'album,artist,track', limit = 20) {
  const token = await getAppAccessToken();
  
  const response = await axios.get('https://api.spotify.com/v1/search', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      q: query,
      type: type,
      limit: limit,
      market: 'US'
    },
  });

  return response.data;
}

const geminiService = new GeminiNaturalLanguageService();

// Natural Language Search endpoint
router.post('/natural-language', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Processing natural language query:', query);

    // Parse natural language query
    const musicQuery = await geminiService.parseNaturalLanguageQuery(query);
    console.log('Parsed music query:', musicQuery);

    // Generate Spotify search query
    const spotifyQuery = geminiService.generateSpotifyQuery(musicQuery);
    console.log('Generated Spotify query:', spotifyQuery);

    // Determine search type based on musicQuery type
    let searchType = 'album,artist,track';
    if (musicQuery.type === 'album') {
      searchType = 'album';
    } else if (musicQuery.type === 'artist') {
      searchType = 'artist';
    } else if (musicQuery.type === 'track') {
      searchType = 'track';
    }

    // Search Spotify
    const spotifyResults = await searchSpotify(spotifyQuery, searchType, 20);

    // Format results
    const results = {
      query: musicQuery,
      spotifyQuery: spotifyQuery,
      albums: spotifyResults.albums?.items?.map(album => ({
        id: album.id,
        name: album.name,
        artists: album.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        images: album.images,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        external_urls: album.external_urls,
        popularity: album.popularity
      })) || [],
      artists: spotifyResults.artists?.items?.map(artist => ({
        id: artist.id,
        name: artist.name,
        images: artist.images,
        genres: artist.genres,
        popularity: artist.popularity,
        external_urls: artist.external_urls
      })) || [],
      tracks: spotifyResults.tracks?.items?.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images
        },
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        external_urls: track.external_urls,
        popularity: track.popularity
      })) || []
    };

    console.log('Search results:', {
      albums: results.albums.length,
      artists: results.artists.length,
      tracks: results.tracks.length
    });

    res.json(results);
  } catch (error) {
    console.error('Natural language search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;