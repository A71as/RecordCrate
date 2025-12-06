import axios from 'axios';
import { spotifyService } from './spotify';
import type { SpotifyAlbum, SpotifyTrack } from '../types';

interface BillboardTrack {
  rank: number;
  title: string;
  artist: string;
}

class BillboardService {
  private cache: {
    tracks: BillboardTrack[];
    timestamp: number;
  } | null = null;

  private spotifyMatchCache: Map<string, SpotifyTrack | null> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours - Billboard updates weekly
  private readonly STORAGE_KEY = 'billboard_hot100_cache';
  private readonly SPOTIFY_MATCH_KEY = 'billboard_spotify_matches';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load cached data from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load Billboard tracks cache
      const storedCache = localStorage.getItem(this.STORAGE_KEY);
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        if (parsed && parsed.tracks && parsed.timestamp) {
          // Check if cache is still valid
          if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
            this.cache = parsed;
            console.log('✅ Loaded Billboard cache from localStorage:', parsed.tracks.length, 'tracks');
          } else {
            console.log('🕐 Billboard cache expired, will fetch fresh data');
            localStorage.removeItem(this.STORAGE_KEY);
          }
        }
      }

      // Load Spotify matches cache
      const storedMatches = localStorage.getItem(this.SPOTIFY_MATCH_KEY);
      if (storedMatches) {
        const parsed = JSON.parse(storedMatches);
        if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          this.spotifyMatchCache = new Map(Object.entries(parsed.matches));
          console.log('✅ Loaded', this.spotifyMatchCache.size, 'Spotify matches from localStorage');
        } else {
          localStorage.removeItem(this.SPOTIFY_MATCH_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load Billboard cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      // Save Billboard tracks
      if (this.cache) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
      }

      // Save Spotify matches
      if (this.spotifyMatchCache.size > 0) {
        const matchesObj = Object.fromEntries(this.spotifyMatchCache);
        localStorage.setItem(this.SPOTIFY_MATCH_KEY, JSON.stringify({
          matches: matchesObj,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.warn('Failed to save Billboard cache to localStorage:', error);
    }
  }

  /**
   * Fetch Billboard Hot 100 from backend API (bypasses CORS issues)
   */
  private async scrapeBillboardHot100(): Promise<BillboardTrack[]> {
    try {
      // Use our backend API to fetch Billboard data (bypasses CORS)
      // In production (Netlify), this will use Netlify Functions via the redirect
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/billboard/hot-100` : '/api/billboard/hot-100';
      
      console.log('Billboard API URL:', apiUrl);
      console.log('Environment:', import.meta.env.MODE);
      console.log('Fetching current Billboard Hot 100 from backend API...');
      
      const response = await axios.get(apiUrl, {
        timeout: 30000, // Longer timeout since backend needs to scrape
      });

      console.log('Billboard API response status:', response.status);
      console.log('Billboard API response data:', response.data);
      console.log('Billboard API response type:', typeof response.data);
      console.log('Billboard API response keys:', Object.keys(response.data || {}));

      // Handle the response data - it might be double-wrapped or stringified
      let responseData = response.data;
      
      // If the response is a string, try to parse it
      if (typeof responseData === 'string') {
        console.log('Response is a string, parsing JSON...');
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Invalid JSON response from Billboard API');
        }
      }

      console.log('Parsed response data:', responseData);
      console.log('Has success field?', 'success' in (responseData || {}));
      console.log('Has tracks field?', 'tracks' in (responseData || {}));

      if (responseData && responseData.success && Array.isArray(responseData.tracks)) {
        const tracks = responseData.tracks;
        console.log(`✅ Successfully fetched ${tracks.length} current Billboard tracks (source: ${responseData.source})`);
        console.log('Top 5 tracks:', tracks.slice(0, 5));
        return tracks;
      }

      console.error('Invalid response structure. Expected: { success: true, tracks: [...] }');
      console.error('Actual response:', responseData);
      throw new Error(`Invalid response from Billboard API. Structure: ${JSON.stringify(Object.keys(responseData || {}))}`);

      
    } catch (error) {
      console.error('❌ Failed to fetch Billboard Hot 100:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
      }
      throw new Error('Unable to fetch current Billboard Hot 100. Backend API error.');
    }
  }

  /**
   * Get Billboard Hot 100 tracks (cached with stale-while-revalidate)
   */
  async getBillboardHot100(): Promise<BillboardTrack[]> {
    const now = Date.now();
    
    // Check cache
    if (this.cache && now - this.cache.timestamp < this.CACHE_DURATION) {
      console.log('✅ Using cached Billboard data');
      return this.cache.tracks;
    }

    // If cache is stale but exists, return it while fetching fresh data in background
    if (this.cache && this.cache.tracks.length > 0) {
      console.log('⚡ Returning stale cache, refreshing in background...');
      // Return cached data immediately
      const staleData = this.cache.tracks;
      
      // Refresh in background (don't await)
      this.refreshBillboardData().catch(err => {
        console.warn('Background refresh failed:', err);
      });
      
      return staleData;
    }

    // No cache at all, fetch fresh data
    console.log('📡 Fetching fresh Billboard Hot 100 data...');
    const tracks = await this.scrapeBillboardHot100();
    
    if (tracks.length === 0) {
      throw new Error('Failed to fetch Billboard Hot 100 - no tracks returned');
    }
    
    // Update cache
    this.cache = {
      tracks,
      timestamp: Date.now(),
    };

    // Persist to localStorage
    this.saveToStorage();

    return tracks;
  }

  /**
   * Background refresh of Billboard data
   */
  private async refreshBillboardData(): Promise<void> {
    const tracks = await this.scrapeBillboardHot100();
    
    if (tracks.length > 0) {
      this.cache = {
        tracks,
        timestamp: Date.now(),
      };
      this.saveToStorage();
      console.log('✅ Background refresh complete');
    }
  }

  /**
   * Get Billboard Hot 100 tracks with Spotify data (paginated for infinite scroll)
   */
  async getBillboardTracksWithSpotifyData(
    page: number = 0,
    limit: number = 20
  ): Promise<{ tracks: (SpotifyTrack | BillboardTrack)[]; hasMore: boolean; total: number }> {
    try {
      // Get all 100 tracks from Billboard
      const billboardTracks = await this.getBillboardHot100();
      const total = billboardTracks.length;
      
      // Calculate pagination
      const startIndex = page * limit;
      const endIndex = Math.min(startIndex + limit, total);
      const hasMore = endIndex < total;
      
      // Get the tracks for this page
      const tracksToMatch = billboardTracks.slice(startIndex, endIndex);
      
      // Process tracks in parallel batches of 10 for faster loading (increased from 5)
      const batchSize = 10;
      const results: (SpotifyTrack | BillboardTrack)[] = [];
      
      for (let i = 0; i < tracksToMatch.length; i += batchSize) {
        const batch = tracksToMatch.slice(i, i + batchSize);
        
        // Search all tracks in the batch simultaneously
        const batchResults = await Promise.all(
          batch.map(async (track) => {
            try {
              // Check cache first using unique key
              const cacheKey = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
              const cachedMatch = this.spotifyMatchCache.get(cacheKey);
              
              if (cachedMatch !== undefined) {
                // Use cached result (can be null if no match was found previously)
                if (cachedMatch) {
                  const spotifyTrack = { ...cachedMatch };
                  (spotifyTrack as any).billboardRank = track.rank;
                  (spotifyTrack as any).isSpotifyMatched = true;
                  return spotifyTrack;
                } else {
                  // Previously determined no match exists
                  return {
                    ...track,
                    isSpotifyMatched: false,
                    billboardRank: track.rank,
                  } as any;
                }
              }

              // Not in cache, search Spotify
              const query = `track:${track.title} artist:${track.artist}`;
              const searchResults = await spotifyService.searchTracks(query);
              
              if (searchResults.length > 0) {
                const spotifyTrack = searchResults[0];
                // Cache the match
                this.spotifyMatchCache.set(cacheKey, spotifyTrack);
                // Mark as matched and add Billboard rank
                (spotifyTrack as any).billboardRank = track.rank;
                (spotifyTrack as any).isSpotifyMatched = true;
                return spotifyTrack;
              } else {
                // Cache the non-match to avoid searching again
                this.spotifyMatchCache.set(cacheKey, null);
                // Return Billboard track as placeholder
                console.log(`No Spotify match for: #${track.rank}: ${track.title} by ${track.artist}`);
                return {
                  ...track,
                  isSpotifyMatched: false,
                  billboardRank: track.rank,
                } as any;
              }
            } catch (error) {
              console.warn(`Failed to match track: #${track.rank}: ${track.title} by ${track.artist}`, error);
              // Return Billboard track as placeholder on error
              return {
                ...track,
                isSpotifyMatched: false,
                billboardRank: track.rank,
              } as any;
            }
          })
        );
        
        results.push(...batchResults);
      }

      // Save Spotify matches to localStorage for future use
      this.saveToStorage();
      
      return {
        tracks: results,
        hasMore,
        total,
      };
    } catch (error) {
      console.error('Failed to get Billboard tracks with Spotify data:', error);
      return {
        tracks: [],
        hasMore: false,
        total: 0,
      };
    }
  }

  /**
   * Match Billboard tracks to Spotify albums (legacy - only shows first 20)
   */
  async getBillboardAlbumsFromSpotify(): Promise<SpotifyAlbum[]> {
    const billboardTracks = await this.getBillboardHot100();
    const albums: SpotifyAlbum[] = [];
    const albumIds = new Set<string>();

    // Get first 20 tracks to match
    const tracksToMatch = billboardTracks.slice(0, 20);

    for (const track of tracksToMatch) {
      try {
        // Search Spotify for the track
        const query = `track:${track.title} artist:${track.artist}`;
        const searchResults = await spotifyService.searchTracks(query);

        if (searchResults.length > 0) {
          const spotifyTrack = searchResults[0];
          const album = spotifyTrack.album;

          // Add album if we haven't already
          if (album && !albumIds.has(album.id)) {
            albumIds.add(album.id);
            
            // Get full album details for consistency
            const fullAlbum = await spotifyService.getAlbum(album.id);
            albums.push(fullAlbum);
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to match track: ${track.title} by ${track.artist}`, error);
      }
    }

    return albums;
  }
}

export const billboardService = new BillboardService();
