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
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.1, // Low temperature for more consistent, accurate parsing
          topP: 0.8,
          topK: 20,
        }
      });

      const prompt = `You are a music search query parser. Parse the following natural language music search query into structured data for Spotify API search.

Query: "${query}"

CRITICAL INSTRUCTIONS:
1. Extract EXACT artist/album/song names as they appear in the query
2. Be PRECISE with search terms - preserve capitalization and full names
3. Identify the PRIMARY search intent (what the user really wants)
4. Don't add genres/moods unless explicitly mentioned or strongly implied
5. For "similar to" queries, the similarTo field should contain the EXACT reference
6. Convert year mentions (e.g., "2015", "90s", "nineties") to decade format: "2010s", "1990s"
7. Distinguish between artist search vs their albums/tracks

OUTPUT FORMAT (valid JSON only):
{
  "type": "album|artist|track|mixed",
  "searchTerms": ["exact", "search", "terms"],
  "genres": ["genre1"] or null,
  "decades": ["2010s"] or null,
  "mood": ["mood1"] or null,
  "similarTo": "Exact Artist - Album Name" or null,
  "description": "clear description"
}

EXAMPLES:

Input: "albums like Blonde by Frank Ocean"
Output: {"type":"album","searchTerms":["frank ocean","blonde"],"genres":null,"decades":null,"mood":null,"similarTo":"Frank Ocean - Blonde","description":"albums similar to Blonde by Frank Ocean"}

Input: "Taylor Swift reputation album"
Output: {"type":"album","searchTerms":["taylor swift","reputation"],"genres":null,"decades":null,"mood":null,"similarTo":null,"description":"Taylor Swift's Reputation album"}

Input: "sad indie songs from 2010s"
Output: {"type":"track","searchTerms":["indie"],"genres":["indie"],"decades":["2010s"],"mood":["sad","melancholic"],"similarTo":null,"description":"sad indie songs from the 2010s"}

Input: "The Weeknd"
Output: {"type":"artist","searchTerms":["the weeknd"],"genres":null,"decades":null,"mood":null,"similarTo":null,"description":"The Weeknd artist"}

Input: "Kanye West graduation"
Output: {"type":"album","searchTerms":["kanye west","graduation"],"genres":null,"decades":null,"mood":null,"similarTo":null,"description":"Graduation album by Kanye West"}

Input: "chill lo-fi hip hop beats"
Output: {"type":"track","searchTerms":["lo-fi","hip hop","beats"],"genres":["hip-hop","lo-fi"],"decades":null,"mood":["chill","relaxing"],"similarTo":null,"description":"chill lo-fi hip hop instrumental beats"}

Input: "90s alternative rock bands"
Output: {"type":"artist","searchTerms":["alternative rock"],"genres":["alternative","rock"],"decades":["1990s"],"mood":null,"similarTo":null,"description":"alternative rock bands from the 1990s"}

Input: "songs like Blinding Lights"
Output: {"type":"track","searchTerms":["blinding lights"],"genres":null,"decades":null,"mood":null,"similarTo":"Blinding Lights","description":"songs similar to Blinding Lights"}

Input: "Billie Eilish when we all fall asleep"
Output: {"type":"album","searchTerms":["billie eilish","when we all fall asleep"],"genres":null,"decades":null,"mood":null,"similarTo":null,"description":"When We All Fall Asleep, Where Do We Go? album by Billie Eilish"}

Input: "upbeat workout music"
Output: {"type":"track","searchTerms":["workout"],"genres":null,"decades":null,"mood":["upbeat","energetic","motivating"],"similarTo":null,"description":"upbeat energetic workout music"}

GENRE KEYWORDS: pop, rock, hip-hop, rap, indie, electronic, edm, jazz, classical, country, r&b, soul, funk, blues, folk, punk, metal, alternative, reggae, latin, k-pop, disco, house, techno, ambient, lo-fi

MOOD KEYWORDS: sad, happy, upbeat, chill, energetic, mellow, dark, bright, emotional, calm, intense, relaxing, aggressive, romantic, melancholic, nostalgic, dreamy, angry, peaceful, motivating

TIME PERIOD CONVERSION:
- "2020", "2020s", "twenties" → "2020s"
- "2015", "2010s", "2010", "tens" → "2010s"  
- "2005", "2000s", "2000", "aughts" → "2000s"
- "1995", "1990s", "90s", "nineties" → "1990s"
- "1985", "1980s", "80s", "eighties" → "1980s"
- "1975", "1970s", "70s", "seventies" → "1970s"
- "1965", "1960s", "60s", "sixties" → "1960s"

Return ONLY the JSON object, no markdown, no explanation, no extra text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean up markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
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
    
    const genres = ['pop', 'rock', 'hip-hop', 'hip hop', 'rap', 'indie', 'electronic', 'edm', 'jazz', 'classical', 'country', 'r&b', 'soul', 'funk', 'blues', 'folk', 'punk', 'metal', 'alternative', 'reggae', 'latin', 'k-pop', 'kpop', 'disco', 'house', 'techno', 'ambient', 'lo-fi', 'lofi'];
    const moods = ['sad', 'happy', 'upbeat', 'chill', 'energetic', 'mellow', 'dark', 'bright', 'emotional', 'calm', 'intense', 'relaxing', 'aggressive', 'romantic', 'melancholic', 'nostalgic', 'dreamy', 'angry', 'peaceful'];
    const decades = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s'];
    
    const foundGenres = genres.filter(genre => lowercaseQuery.includes(genre));
    const foundMoods = moods.filter(mood => lowercaseQuery.includes(mood));
    const foundDecades = decades.filter(decade => {
      const year = decade.slice(0, 4);
      return lowercaseQuery.includes(decade) || 
             lowercaseQuery.includes(year) || 
             lowercaseQuery.includes(year.slice(2, 4) + 's') ||
             (decade === '1990s' && (lowercaseQuery.includes('90s') || lowercaseQuery.includes('nineties'))) ||
             (decade === '1980s' && (lowercaseQuery.includes('80s') || lowercaseQuery.includes('eighties'))) ||
             (decade === '2000s' && (lowercaseQuery.includes('00s') || lowercaseQuery.includes('aughts')));
    });

    let type = 'mixed';
    if (lowercaseQuery.includes('album') || lowercaseQuery.includes('albums')) {
      type = 'album';
    } else if (lowercaseQuery.includes('artist') || lowercaseQuery.includes('artists') || lowercaseQuery.includes('band') || lowercaseQuery.includes('bands')) {
      type = 'artist';
    } else if (lowercaseQuery.includes('song') || lowercaseQuery.includes('songs') || lowercaseQuery.includes('track') || lowercaseQuery.includes('tracks')) {
      type = 'track';
    }

    let similarTo = null;
    const likePatterns = [
      /like\s+(.+?)(?:\s+by\s+|\s+from\s+|$)/i,
      /similar\s+to\s+(.+?)(?:\s+by\s+|\s+from\s+|$)/i,
      /sounds?\s+like\s+(.+?)(?:\s+by\s+|\s+from\s+|$)/i
    ];
    
    for (const pattern of likePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        similarTo = match[1].trim();
        break;
      }
    }

    const byMatch = query.match(/by\s+([A-Z][\w\s&'.]+?)(?:\s+(?:from|in|album|track|song)|$)/i);
    const artistName = byMatch ? byMatch[1].trim() : null;

    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'like', 'similar', 'albums', 'artists', 'songs', 'tracks', 'music', 'from', 'sounds', 'band', 'bands', 'give', 'me', 'some', 'find', 'show', 'search'];
    
    const words = query.split(/\s+/);
    const searchTerms = [];
    
    for (const word of words) {
      const lowerWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (lowerWord.length > 2 && 
          !commonWords.includes(lowerWord) && 
          !foundGenres.some(g => g.replace(/[^\w]/g, '') === lowerWord) && 
          !foundMoods.includes(lowerWord)) {
        searchTerms.push(word.replace(/[^\w\s]/g, ''));
      }
    }

    if (artistName && !searchTerms.some(term => term.toLowerCase().includes(artistName.toLowerCase()))) {
      searchTerms.unshift(artistName);
    }

    return {
      type,
      searchTerms: searchTerms.slice(0, 5),
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

    // Prioritize "similar to" references first
    if (musicQuery.similarTo) {
      parts.push(musicQuery.similarTo);
    }

    // Add main search terms
    if (musicQuery.searchTerms.length > 0) {
      const searchTermString = musicQuery.searchTerms.join(' ');
      // Only add if not already included in similarTo
      if (!musicQuery.similarTo || !musicQuery.similarTo.toLowerCase().includes(searchTermString.toLowerCase())) {
        parts.push(searchTermString);
      }
    }

    // Add genre filters with Spotify's genre syntax
    if (musicQuery.genres && musicQuery.genres.length > 0) {
      const genreTerms = musicQuery.genres.map(genre => {
        // Normalize genre names for Spotify API
        const normalizedGenre = genre.replace(/&/g, 'and').replace(/\s+/g, '-');
        return `genre:"${normalizedGenre}"`;
      });
      parts.push(...genreTerms);
    }

    // Add year range filters
    if (musicQuery.decades && musicQuery.decades.length > 0) {
      const years = musicQuery.decades.map(decade => {
        const startYear = parseInt(decade.slice(0, 4));
        const endYear = startYear + 9;
        return `year:${startYear}-${endYear}`;
      });
      // Use OR for multiple decades
      if (years.length > 1) {
        parts.push(`(${years.join(' OR ')})`);
      } else {
        parts.push(years[0]);
      }
    }

    const query = parts.join(' ').trim();
    
    // Fallback to broader search if query is too restrictive or empty
    if (!query || query.length < 2) {
      return musicQuery.searchTerms.length > 0 
        ? musicQuery.searchTerms.join(' ') 
        : 'popular music';
    }

    return query;
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

    // Extract artist name from similarTo for filtering
    let excludeArtistName = null;
    if (musicQuery.similarTo && musicQuery.type === 'album') {
      // Check if similarTo is just an artist name or "Artist - Album" format
      const artistAlbumMatch = musicQuery.similarTo.match(/^(.+?)\s*[-–—]\s*.+$/);
      if (artistAlbumMatch) {
        // Format: "Artist - Album"
        excludeArtistName = artistAlbumMatch[1].trim().toLowerCase();
      } else {
        // Might be just an artist name - check if it matches search terms
        const lowerSimilarTo = musicQuery.similarTo.toLowerCase();
        // If similarTo doesn't contain common album words, it's likely an artist name
        if (!lowerSimilarTo.includes('album') && 
            !lowerSimilarTo.includes('mixtape') && 
            !lowerSimilarTo.includes('ep') &&
            musicQuery.searchTerms.some(term => lowerSimilarTo.includes(term.toLowerCase()))) {
          excludeArtistName = musicQuery.similarTo.toLowerCase();
        }
      }
    }

    // Format and filter results
    const results = {
      query: musicQuery,
      spotifyQuery: spotifyQuery,
      albums: (spotifyResults.albums?.items?.map(album => ({
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
      })) || []).filter(album => {
        // Filter out albums by the same artist when searching "albums like [artist]"
        if (excludeArtistName) {
          return !album.artists.some(artist => 
            artist.name.toLowerCase().includes(excludeArtistName) || 
            excludeArtistName.includes(artist.name.toLowerCase())
          );
        }
        return true;
      }),
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