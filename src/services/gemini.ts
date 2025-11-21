import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface MusicQuery {
  type: 'album' | 'artist' | 'track' | 'mixed';
  searchTerms: string[];
  genres?: string[];
  decades?: string[];
  mood?: string[];
  similarTo?: string;
  description?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
  }

  isAvailable(): boolean {
    return this.genAI !== null && GEMINI_API_KEY !== undefined;
  }

  async parseNaturalLanguageQuery(query: string): Promise<MusicQuery> {
    if (!this.isAvailable()) {
      // Fallback to basic parsing if Gemini is not available
      return this.basicParseQuery(query);
    }

    try {
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });

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

  private basicParseQuery(query: string): MusicQuery {
    const lowercaseQuery = query.toLowerCase();
    
    // Basic keyword detection
    const genres = ['pop', 'rock', 'hip-hop', 'rap', 'indie', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'soul', 'funk', 'blues', 'folk', 'punk', 'metal', 'alternative'];
    const moods = ['sad', 'happy', 'upbeat', 'chill', 'energetic', 'mellow', 'dark', 'bright', 'emotional', 'calm', 'intense'];
    const decades = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s'];
    
    const foundGenres = genres.filter(genre => lowercaseQuery.includes(genre));
    const foundMoods = moods.filter(mood => lowercaseQuery.includes(mood));
    const foundDecades = decades.filter(decade => {
      const year = decade.slice(0, 4);
      return lowercaseQuery.includes(decade) || lowercaseQuery.includes(year) || lowercaseQuery.includes(year.slice(2, 4) + 's');
    });

    // Determine type
    let type: 'album' | 'artist' | 'track' | 'mixed' = 'mixed';
    if (lowercaseQuery.includes('album') || lowercaseQuery.includes('albums')) {
      type = 'album';
    } else if (lowercaseQuery.includes('artist') || lowercaseQuery.includes('artists')) {
      type = 'artist';
    } else if (lowercaseQuery.includes('song') || lowercaseQuery.includes('songs') || lowercaseQuery.includes('track') || lowercaseQuery.includes('tracks')) {
      type = 'track';
    }

    // Extract similar to references
    let similarTo = null;
    const likeMatch = lowercaseQuery.match(/like (.+?)(?:\s|$)/);
    const similarMatch = lowercaseQuery.match(/similar to (.+?)(?:\s|$)/);
    if (likeMatch) {
      similarTo = likeMatch[1];
    } else if (similarMatch) {
      similarTo = similarMatch[1];
    }

    // Basic search terms extraction (remove common words)
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'like', 'similar', 'albums', 'artists', 'songs', 'tracks', 'music', 'from'];
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word) && !foundGenres.includes(word) && !foundMoods.includes(word))
      .slice(0, 5); // Limit to 5 terms

    return {
      type,
      searchTerms,
      genres: foundGenres.length > 0 ? foundGenres : undefined,
      decades: foundDecades.length > 0 ? foundDecades : undefined,
      mood: foundMoods.length > 0 ? foundMoods : undefined,
      similarTo: similarTo || undefined,
      description: query
    };
  }

  private validateAndCleanMusicQuery(query: any): MusicQuery {
    return {
      type: ['album', 'artist', 'track', 'mixed'].includes(query.type) ? query.type : 'mixed',
      searchTerms: Array.isArray(query.searchTerms) ? query.searchTerms.slice(0, 5) : [query.searchTerms || ''].filter(Boolean),
      genres: Array.isArray(query.genres) && query.genres.length > 0 ? query.genres : undefined,
      decades: Array.isArray(query.decades) && query.decades.length > 0 ? query.decades : undefined,
      mood: Array.isArray(query.mood) && query.mood.length > 0 ? query.mood : undefined,
      similarTo: typeof query.similarTo === 'string' ? query.similarTo : undefined,
      description: typeof query.description === 'string' ? query.description : query.searchTerms?.join(' ') || ''
    };
  }

  generateSpotifyQuery(musicQuery: MusicQuery): string {
    const parts: string[] = [];

    // Add main search terms
    if (musicQuery.searchTerms.length > 0) {
      parts.push(musicQuery.searchTerms.join(' '));
    }

    // Add genre constraints
    if (musicQuery.genres && musicQuery.genres.length > 0) {
      musicQuery.genres.forEach(genre => {
        parts.push(`genre:"${genre}"`);
      });
    }

    // Add year constraints based on decades
    if (musicQuery.decades && musicQuery.decades.length > 0) {
      const years = musicQuery.decades.map(decade => {
        const startYear = parseInt(decade.slice(0, 4));
        return `year:${startYear}-${startYear + 9}`;
      });
      parts.push(`(${years.join(' OR ')})`);
    }

    // If searching for similar music, adjust the query
    if (musicQuery.similarTo) {
      parts.unshift(musicQuery.similarTo);
    }

    return parts.join(' ').trim() || 'popular';
  }
}

export const geminiService = new GeminiService();
export type { MusicQuery };