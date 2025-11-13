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

  private readonly CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours - refresh more often for current chart

  /**
   * Fetch Billboard Hot 100 from backend API (bypasses CORS issues)
   */
  private async scrapeBillboardHot100(): Promise<BillboardTrack[]> {
    try {
      // Use our backend API to fetch Billboard data (bypasses CORS)
      const apiUrl = 'http://127.0.0.1:4000/api/billboard/hot-100';
      
      console.log('Fetching current Billboard Hot 100 from backend API...');
      const response = await axios.get(apiUrl, {
        timeout: 30000, // Longer timeout since backend needs to scrape
      });

      if (response.data.success && Array.isArray(response.data.tracks)) {
        const tracks = response.data.tracks;
        console.log(`✅ Successfully fetched ${tracks.length} current Billboard tracks (source: ${response.data.source})`);
        console.log('Top 5 tracks:', tracks.slice(0, 5));
        return tracks;
      }

      throw new Error('Invalid response from Billboard API');
      
    } catch (error) {
      console.error('❌ Failed to fetch Billboard Hot 100:', error);
      throw new Error('Unable to fetch current Billboard Hot 100. Backend API error.');
    }
  }

  /**
   * Get Billboard Hot 100 tracks (cached)
   */
  async getBillboardHot100(): Promise<BillboardTrack[]> {
    // Check cache
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      console.log('Using cached Billboard data');
      return this.cache.tracks;
    }

    // Fetch new data
    console.log('Fetching fresh Billboard Hot 100 data...');
    const tracks = await this.scrapeBillboardHot100();
    
    if (tracks.length === 0) {
      throw new Error('Failed to fetch Billboard Hot 100 - no tracks returned');
    }
    
    // Update cache
    this.cache = {
      tracks,
      timestamp: Date.now(),
    };

    return tracks;
  }

  /**
   * Get Billboard Hot 100 tracks with Spotify data (paginated for infinite scroll)
   */
  async getBillboardTracksWithSpotifyData(
    page: number = 0,
    limit: number = 20
  ): Promise<{ tracks: SpotifyTrack[]; hasMore: boolean; total: number }> {
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
      
      const spotifyTracks: SpotifyTrack[] = [];
      const skippedTracks: string[] = [];
      
      // Match each Billboard track to Spotify
      for (const track of tracksToMatch) {
        try {
          const query = `track:${track.title} artist:${track.artist}`;
          const searchResults = await spotifyService.searchTracks(query);
          
          if (searchResults.length > 0) {
            const spotifyTrack = searchResults[0];
            // Add the Billboard rank and any skipped tracks before this one
            (spotifyTrack as any).billboardRank = track.rank;
            if (skippedTracks.length > 0) {
              (spotifyTrack as any).skippedBefore = [...skippedTracks];
              skippedTracks.length = 0; // Clear the array
            }
            spotifyTracks.push(spotifyTrack);
          } else {
            // No match found - track this as skipped
            const skippedInfo = `#${track.rank}: ${track.title} by ${track.artist}`;
            skippedTracks.push(skippedInfo);
            console.log(`No Spotify match for: ${skippedInfo}`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const skippedInfo = `#${track.rank}: ${track.title} by ${track.artist}`;
          skippedTracks.push(skippedInfo);
          console.warn(`Failed to match track: ${skippedInfo}`, error);
        }
      }
      
      // If there are trailing skipped tracks, attach them to the last track
      if (skippedTracks.length > 0 && spotifyTracks.length > 0) {
        const lastTrack = spotifyTracks[spotifyTracks.length - 1];
        const existing = (lastTrack as any).skippedBefore || [];
        (lastTrack as any).skippedBefore = [...existing, ...skippedTracks];
      }
      
      return {
        tracks: spotifyTracks,
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
