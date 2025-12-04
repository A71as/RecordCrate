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
    
    // Artist genre database - add known artists and their genres
    this.artistGenres = {
      // Hip-Hop/Rap
      'kendrick lamar': { 
        genres: ['hip-hop', 'rap'], 
        styles: ['conscious rap', 'west coast hip hop', 'jazz rap'], 
        moods: ['introspective', 'lyrical'],
        similarArtists: ['J. Cole', 'Vince Staples', 'Joey Bada$$', 'Denzel Curry', 'Isaiah Rashad']
      },
      'j cole': { 
        genres: ['hip-hop', 'rap'], 
        styles: ['conscious rap', 'southern hip hop'], 
        moods: ['introspective', 'storytelling'],
        similarArtists: ['Kendrick Lamar', 'Logic', 'Wale', 'Big K.R.I.T.', 'JID']
      },
      'drake': { 
        genres: ['hip-hop', 'rap', 'r&b'], 
        styles: ['melodic rap', 'ovo sound'], 
        moods: ['moody', 'atmospheric'],
        similarArtists: ['PartyNextDoor', 'Tory Lanez', 'Bryson Tiller', 'The Weeknd', 'Roy Woods']
      },
      'tyler the creator': { 
        genres: ['hip-hop', 'rap'], 
        styles: ['alternative hip hop', 'neo soul rap'], 
        moods: ['experimental', 'jazzy'],
        similarArtists: ['Steve Lacy', 'Kali Uchis', 'Thundercat', 'Mac Miller', 'Childish Gambino']
      },
      'kanye west': { 
        genres: ['hip-hop', 'rap'], 
        styles: ['alternative hip hop', 'experimental'], 
        moods: ['bold', 'innovative'],
        similarArtists: ['Kid Cudi', 'Travis Scott', 'Pusha T', 'Jay-Z', 'Playboi Carti']
      },
      
      // R&B/Soul
      'frank ocean': { 
        genres: ['r&b', 'alternative'], 
        styles: ['alternative r&b', 'neo-soul', 'ambient'], 
        moods: ['atmospheric', 'introspective'],
        similarArtists: ['Daniel Caesar', 'Steve Lacy', 'SZA', 'Brent Faiyaz', 'Sampha']
      },
      'the weeknd': { 
        genres: ['r&b', 'pop'], 
        styles: ['alternative r&b', 'dark pop', 'synth pop'], 
        moods: ['dark', 'atmospheric'],
        similarArtists: ['PartyNextDoor', 'Bryson Tiller', 'Tory Lanez', 'DVSN', 'Miguel']
      },
      'sza': { 
        genres: ['r&b', 'neo-soul'], 
        styles: ['alternative r&b', 'contemporary r&b'], 
        moods: ['emotional', 'introspective'],
        similarArtists: ['Summer Walker', 'Jhené Aiko', 'Kehlani', 'H.E.R.', 'Ella Mai']
      },
      'daniel caesar': { 
        genres: ['r&b', 'soul'], 
        styles: ['contemporary r&b', 'neo-soul'], 
        moods: ['smooth', 'romantic'],
        similarArtists: ['Frank Ocean', 'Jordan Rakei', 'Lucky Daye', 'Kiana Ledé', 'Mahalia']
      },
      
      // Indie/Alternative
      'malcolm todd': { 
        genres: ['indie', 'alternative', 'pop'], 
        styles: ['indie pop', 'bedroom pop', 'lo-fi'], 
        moods: ['dreamy', 'laid-back'],
        similarArtists: ['Rex Orange County', 'Gus Dapperton', 'Cuco', 'Boy Pablo', 'Clairo']
      },
      'rex orange county': { 
        genres: ['indie', 'alternative', 'pop'], 
        styles: ['indie pop', 'bedroom pop'], 
        moods: ['upbeat', 'feel-good'],
        similarArtists: ['Cuco', 'Omar Apollo', 'Wallows', 'The Marias', 'Gus Dapperton']
      },
      'clairo': { 
        genres: ['indie', 'alternative', 'pop'], 
        styles: ['bedroom pop', 'indie pop'], 
        moods: ['dreamy', 'lo-fi'],
        similarArtists: ['Girl in Red', 'Beabadoobee', 'Chloe Moriondo', 'Conan Gray', 'mxmtoon']
      },
      'tame impala': { 
        genres: ['indie', 'psychedelic', 'rock'], 
        styles: ['psychedelic pop', 'neo-psychedelia'], 
        moods: ['dreamy', 'atmospheric'],
        similarArtists: ['MGMT', 'Unknown Mortal Orchestra', 'Pond', 'Melody\'s Echo Chamber', 'Temples']
      },
      'radiohead': { 
        genres: ['alternative', 'rock'], 
        styles: ['alternative rock', 'experimental rock', 'art rock'], 
        moods: ['melancholic', 'atmospheric'],
        similarArtists: ['Thom Yorke', 'Atoms for Peace', 'Portishead', 'Massive Attack', 'Sigur Rós']
      },
      
      // Pop
      'taylor swift': { 
        genres: ['pop', 'country'], 
        styles: ['pop', 'country pop', 'synth pop'], 
        moods: ['emotional', 'storytelling'],
        similarArtists: ['Olivia Rodrigo', 'Sabrina Carpenter', 'Gracie Abrams', 'Conan Gray', 'Phoebe Bridgers']
      },
      'billie eilish': { 
        genres: ['pop', 'alternative'], 
        styles: ['dark pop', 'electropop', 'bedroom pop'], 
        moods: ['dark', 'whisper'],
        similarArtists: ['Finneas', 'Lorde', 'Halsey', 'Melanie Martinez', 'Lana Del Rey']
      },
      'ariana grande': { 
        genres: ['pop', 'r&b'], 
        styles: ['pop', 'contemporary r&b'], 
        moods: ['upbeat', 'powerful'],
        similarArtists: ['Doja Cat', 'Madison Beer', 'Victoria Monét', 'Normani', 'Jhené Aiko']
      }
    };
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
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          topK: 40,
        }
      });

      const prompt = `Parse this music search query into JSON. Focus on INTENT and provide SPECIFIC recommendations.

Query: "${query}"

RULES:
1. For "similar to [artist]" or "like [artist]" queries:
   - Set type to "album" (we want albums similar to that artist)
   - Set excludeArtist to the artist name
   - Use your music knowledge to provide 3-5 SPECIFIC artists who sound similar
   - Add their genre and style descriptors
   
2. For "similar to [album] by [artist]" queries:
   - Set type to "album"
   - Set excludeArtist to the artist name
   - Provide 3-5 SPECIFIC albums or artists with similar sound
   
3. For "artists like [artist]" queries:
   - Set type to "artist"
   - Provide 3-5 SPECIFIC similar artist names
   
4. For direct artist/album searches (no "like" or "similar"):
   - Just extract the exact artist/album name
   - Don't add recommendations

OUTPUT (JSON only, no markdown):
{
  "type": "album|artist|track|mixed",
  "searchTerms": ["specific artist/album names for similarity queries, or exact names for direct search"],
  "similarArtists": ["Artist 1", "Artist 2", "Artist 3"] or null,
  "genres": ["main genre", "subgenre"] or null,
  "mood": ["mood1", "mood2"] or null,
  "similarTo": "Artist Name" or null,
  "excludeArtist": "Artist Name" or null
}

EXAMPLES:

"albums like kendrick lamar"
{"type":"album","searchTerms":["J. Cole","Vince Staples","Joey Bada$$","Denzel Curry"],"similarArtists":["J. Cole","Vince Staples","Joey Bada$$","Denzel Curry","Isaiah Rashad"],"genres":["hip-hop","conscious rap"],"mood":["introspective","lyrical"],"similarTo":"Kendrick Lamar","excludeArtist":"Kendrick Lamar"}

"artists similar to frank ocean"
{"type":"artist","searchTerms":["Daniel Caesar","Steve Lacy","SZA","Brent Faiyaz"],"similarArtists":["Daniel Caesar","Steve Lacy","SZA","Brent Faiyaz","Sampha"],"genres":["r&b","alternative r&b"],"mood":["atmospheric","introspective"],"similarTo":"Frank Ocean","excludeArtist":"Frank Ocean"}

"albums like Blonde by Frank Ocean"
{"type":"album","searchTerms":["Daniel Caesar","Steve Lacy","Blood Orange","Sampha"],"similarArtists":["Daniel Caesar","Steve Lacy","Blood Orange","Sampha","Kali Uchis"],"genres":["r&b","alternative r&b"],"mood":["atmospheric","introspective"],"similarTo":"Frank Ocean","excludeArtist":"Frank Ocean"}

"albums like malcolm todd"
{"type":"album","searchTerms":["Rex Orange County","Gus Dapperton","Cuco","Boy Pablo"],"similarArtists":["Rex Orange County","Gus Dapperton","Cuco","Boy Pablo","Clairo"],"genres":["indie pop","bedroom pop"],"mood":["dreamy","laid-back"],"similarTo":"Malcolm Todd","excludeArtist":"Malcolm Todd"}

"taylor swift reputation"
{"type":"album","searchTerms":["taylor swift","reputation"],"similarArtists":null,"genres":null,"mood":null,"similarTo":null,"excludeArtist":null}

"sad indie songs"
{"type":"track","searchTerms":["Phoebe Bridgers","Bon Iver","Cigarettes After Sex"],"similarArtists":["Phoebe Bridgers","Bon Iver","Cigarettes After Sex"],"genres":["indie"],"mood":["sad","melancholic"],"similarTo":null,"excludeArtist":null}

Parse: "${query}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsed = JSON.parse(text);
        
        console.log('Gemini parsed result:', parsed);
        
        // Enhance with local artist database if available
        if (parsed.similarTo || parsed.excludeArtist) {
          const artistKey = (parsed.similarTo || parsed.excludeArtist).toLowerCase();
          console.log('Looking up artist in database:', artistKey);
          const artistInfo = this.artistGenres[artistKey];
          
          if (artistInfo) {
            console.log('Found in database, enhancing with:', artistInfo);
            // Use local database as authoritative source for similar artists
            if (artistInfo.similarArtists && artistInfo.similarArtists.length > 0) {
              parsed.similarArtists = artistInfo.similarArtists;
              // Also set searchTerms to similar artists for better queries
              parsed.searchTerms = artistInfo.similarArtists;
            }
            parsed.genres = artistInfo.genres;
            parsed.mood = artistInfo.moods;
            // DON'T force type to album if user explicitly wants artists
            // Only change if it's unclear (like "like [artist]" vs "artists like [artist]")
          } else {
            console.log('Artist not found in local database');
          }
        }
        
        console.log('Final parsed query after enhancement:', parsed);
        return this.validateAndCleanMusicQuery(parsed);
      } catch (parseError) {
        console.warn('Gemini parse failed, using enhanced fallback');
        return this.basicParseQuery(query);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.basicParseQuery(query);
    }
  }

  basicParseQuery(query) {
    const lowercaseQuery = query.toLowerCase();
    
    // Check local artist database first for similarity queries
    console.log('Checking artist database for query:', query);
    for (const [artist, info] of Object.entries(this.artistGenres || {})) {
      // Check for "artists similar to [artist]" or "artists like [artist]"
      const artistsLikePattern = new RegExp(`artists?\\s+(?:like|similar to|similar|sounds? like)\\s+${artist}`, 'i');
      // Check for "albums/music/songs like [artist]"
      const likePattern = new RegExp(`(?:albums?|music|songs?|tracks?)\\s+(?:like|similar to|similar|sounds? like)\\s+${artist}`, 'i');
      const byPattern = new RegExp(`(?:albums?|music|songs?|tracks?)\\s+(?:like|similar to|similar|sounds? like)\\s+.+?\\s+by\\s+${artist}`, 'i');
      
      const capitalizedArtist = artist.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      // If searching for similar ARTISTS (not albums)
      if (artistsLikePattern.test(lowercaseQuery)) {
        console.log(`Found artist search in database: ${capitalizedArtist}`, info);
        return {
          type: 'artist',
          searchTerms: info.similarArtists || info.styles,
          similarArtists: info.similarArtists || null,
          genres: info.genres,
          mood: info.moods,
          similarTo: capitalizedArtist,
          excludeArtist: capitalizedArtist,
          description: `artists similar to ${capitalizedArtist}`
        };
      }
      // If searching for similar ALBUMS
      else if (likePattern.test(lowercaseQuery) || byPattern.test(lowercaseQuery)) {
        console.log(`Found album search in database: ${capitalizedArtist}`, info);
        return {
          type: 'album',
          searchTerms: info.similarArtists || info.styles,
          similarArtists: info.similarArtists || null,
          genres: info.genres,
          mood: info.moods,
          similarTo: capitalizedArtist,
          excludeArtist: capitalizedArtist,
          description: `albums similar to ${capitalizedArtist}`
        };
      }
    }
    console.log('No artist match found in database, using generic parsing');
    
    const genres = ['bedroom pop', 'synth pop', 'alt pop', 'indie pop', 'pop', 'rock', 'indie rock', 'alt rock', 'hip-hop', 'hip hop', 'rap', 'indie', 'electronic', 'edm', 'jazz', 'classical', 'country', 'r&b', 'neo-soul', 'neo soul', 'soul', 'funk', 'blues', 'folk', 'punk', 'metal', 'alternative', 'reggae', 'latin', 'k-pop', 'kpop', 'disco', 'house', 'techno', 'ambient', 'lo-fi', 'lofi', 'experimental'];
    const moods = ['sad', 'happy', 'upbeat', 'chill', 'energetic', 'mellow', 'dark', 'bright', 'emotional', 'calm', 'intense', 'relaxing', 'aggressive', 'romantic', 'melancholic', 'nostalgic', 'dreamy', 'angry', 'peaceful', 'atmospheric', 'ethereal', 'moody', 'vibey', 'introspective'];
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
    let excludeArtist = null;
    
    // Check for similarity queries
    const likePatterns = [
      /(?:albums?|music|songs?|tracks?|artists?)\s+(?:like|similar to|sounds? like)\s+(.+?)(?:\s+by\s+|\s*$)/i,
      /(?:like|similar to|sounds? like)\s+(.+?)(?:\s+by\s+|\s*$)/i
    ];
    
    for (const pattern of likePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        similarTo = match[1].trim();
        excludeArtist = similarTo; // Exclude the reference artist
        break;
      }
    }

    const byMatch = query.match(/by\s+([A-Z][\w\s&'.]+?)(?:\s+(?:from|in|album|track|song)|$)/i);
    const artistName = byMatch ? byMatch[1].trim() : null;

    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'like', 'similar', 'albums', 'artists', 'songs', 'tracks', 'music', 'from', 'sounds', 'band', 'bands', 'give', 'me', 'some', 'find', 'show', 'search'];
    
    const words = query.split(/\s+/);
    const searchTerms = [];
    
    // If it's a similarity query, focus on genre/style instead of artist name
    if (similarTo) {
      // Add genres and moods as search terms
      searchTerms.push(...foundGenres, ...foundMoods);
      
      // If STILL no genres/moods detected, don't add generic fallback
      // This should rarely happen now with the artist database
      if (searchTerms.length === 0) {
        // Just use the similarity search without forcing wrong genres
        searchTerms.push('new', 'music');
      }
    } else {
      // Normal search - include all relevant terms
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
    }

    return {
      type,
      searchTerms: searchTerms.slice(0, 5),
      genres: foundGenres.length > 0 ? foundGenres : null,
      decades: foundDecades.length > 0 ? foundDecades : null,
      mood: foundMoods.length > 0 ? foundMoods : null,
      similarTo: similarTo || null,
      excludeArtist: excludeArtist || null,
      description: query
    };
  }

  validateAndCleanMusicQuery(query) {
    return {
      type: ['album', 'artist', 'track', 'mixed'].includes(query.type) ? query.type : 'mixed',
      searchTerms: Array.isArray(query.searchTerms) ? query.searchTerms.slice(0, 5) : [query.searchTerms || ''].filter(Boolean),
      similarArtists: Array.isArray(query.similarArtists) && query.similarArtists.length > 0 ? query.similarArtists : null,
      genres: Array.isArray(query.genres) && query.genres.length > 0 ? query.genres : null,
      mood: Array.isArray(query.mood) && query.mood.length > 0 ? query.mood : null,
      similarTo: typeof query.similarTo === 'string' ? query.similarTo : null,
      excludeArtist: typeof query.excludeArtist === 'string' ? query.excludeArtist : null,
      description: typeof query.description === 'string' ? query.description : query.searchTerms?.join(' ') || ''
    };
  }

  generateSpotifyQuery(musicQuery) {
    console.log('Generating Spotify query from:', JSON.stringify(musicQuery, null, 2));
    const parts = [];

    // For similarity queries, use SPECIFIC artist/album names from AI recommendations
    if (musicQuery.similarTo) {
      console.log('Building similarity search query');
      
      // Priority 1: Use specific artist recommendations from Gemini
      if (musicQuery.similarArtists && musicQuery.similarArtists.length > 0) {
        console.log('Using similar artists:', musicQuery.similarArtists);
        // Simple approach: just list the artist names
        // Spotify will find albums/tracks by these artists
        const artistNames = musicQuery.similarArtists
          .slice(0, 5)
          .map(artist => artist.replace(/[^\w\s]/g, '').trim())
          .join(' OR ');
        parts.push(artistNames);
      } 
      // Fallback: Use search terms if available
      else if (musicQuery.searchTerms && musicQuery.searchTerms.length > 0) {
        console.log('Using search terms as fallback:', musicQuery.searchTerms);
        const excludeLC = musicQuery.excludeArtist?.toLowerCase() || '';
        const relevantTerms = musicQuery.searchTerms.filter(term => {
          const termLC = term.toLowerCase();
          return !(excludeLC && (excludeLC.includes(termLC) || termLC.includes(excludeLC)));
        });
        parts.push(relevantTerms.slice(0, 5).join(' '));
      }
      
      // Add main genre as additional context (not a field filter)
      if (musicQuery.genres && musicQuery.genres.length > 0) {
        console.log('Adding genre context:', musicQuery.genres[0]);
        parts.push(musicQuery.genres[0]);
      }
    } else {
      // Normal search - include search terms or similar artists
      if (musicQuery.similarArtists && musicQuery.similarArtists.length > 0) {
        const artistNames = musicQuery.similarArtists
          .slice(0, 5)
          .map(artist => artist.replace(/[^\w\s]/g, '').trim())
          .join(' OR ');
        parts.push(artistNames);
      } else if (musicQuery.searchTerms && musicQuery.searchTerms.length > 0) {
        parts.push(musicQuery.searchTerms.join(' '));
      }
    }

    const finalQuery = parts.join(' ').trim() || 'popular';
    console.log('Generated Spotify query:', finalQuery);
    return finalQuery;
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

    // Determine which artist to exclude from results
    let excludeArtistName = musicQuery.excludeArtist?.toLowerCase() || null;

    // Additional parsing for excludeArtist if not already set
    if (!excludeArtistName && musicQuery.similarTo) {
      // Check if similarTo is "Artist - Album" format
      const artistAlbumMatch = musicQuery.similarTo.match(/^(.+?)\s*[-–—]\s*.+$/);
      if (artistAlbumMatch) {
        excludeArtistName = artistAlbumMatch[1].trim().toLowerCase();
      } else {
        // Just use the similarTo value directly
        excludeArtistName = musicQuery.similarTo.toLowerCase();
      }
    }

    // Helper function to check if an artist should be excluded
    const shouldExcludeArtist = (artistName) => {
      if (!excludeArtistName) return false;
      const normalizedArtist = artistName.toLowerCase().trim();
      const normalizedExclude = excludeArtistName.trim();
      
      // Exact match or contains
      return normalizedArtist === normalizedExclude || 
             normalizedArtist.includes(normalizedExclude) ||
             normalizedExclude.includes(normalizedArtist);
    };

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
        // Filter out albums by the excluded artist
        if (excludeArtistName) {
          return !album.artists.some(artist => shouldExcludeArtist(artist.name));
        }
        return true;
      }),
      artists: (spotifyResults.artists?.items?.map(artist => ({
        id: artist.id,
        name: artist.name,
        images: artist.images,
        genres: artist.genres,
        popularity: artist.popularity,
        external_urls: artist.external_urls
      })) || []).filter(artist => {
        // Filter out the excluded artist
        if (excludeArtistName) {
          return !shouldExcludeArtist(artist.name);
        }
        return true;
      }),
      tracks: (spotifyResults.tracks?.items?.map(track => ({
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
      })) || []).filter(track => {
        // Filter out tracks by the excluded artist
        if (excludeArtistName) {
          return !track.artists.some(artist => shouldExcludeArtist(artist.name));
        }
        return true;
      })
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