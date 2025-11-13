import axios from 'axios';
import { spotifyService } from './spotify';
import type { SpotifyAlbum } from '../types';

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

  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

  /**
   * Scrape Billboard Hot 100 from the HTML page
   * Note: This is a fallback approach. Ideally use a paid API or server-side scraping.
   */
  private async scrapeBillboardHot100(): Promise<BillboardTrack[]> {
    try {
      // Try to use a CORS proxy for development
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const billboardUrl = encodeURIComponent('https://www.billboard.com/charts/hot-100/');
      
      const response = await axios.get(proxyUrl + billboardUrl, {
        timeout: 10000,
      });

      const html = response.data;
      const tracks: BillboardTrack[] = [];

      // Parse the HTML to extract track information
      // Billboard uses a specific structure - this is fragile and may break
      const titleRegex = /<h3[^>]*id="title-of-a-story"[^>]*>([^<]+)<\/h3>/gi;
      const artistRegex = /<span[^>]*class="[^"]*c-label[^"]*a-no-trucate[^"]*"[^>]*>([^<]+)<\/span>/gi;

      const titles: string[] = [];
      const artists: string[] = [];

      let match;
      while ((match = titleRegex.exec(html)) !== null && titles.length < 100) {
        titles.push(match[1].trim());
      }

      while ((match = artistRegex.exec(html)) !== null && artists.length < 100) {
        const artist = match[1].trim();
        if (artist && !artist.toLowerCase().includes('new') && !artist.toLowerCase().includes('last week')) {
          artists.push(artist);
        }
      }

      // Combine titles and artists
      for (let i = 0; i < Math.min(titles.length, artists.length, 100); i++) {
        tracks.push({
          rank: i + 1,
          title: titles[i],
          artist: artists[i],
        });
      }

      return tracks.length > 0 ? tracks : this.getFallbackTracks();
    } catch (error) {
      console.warn('Failed to scrape Billboard Hot 100, using fallback data:', error);
      return this.getFallbackTracks();
    }
  }

  /**
   * Fallback track list with popular songs
   * Use this when scraping fails or for development
   */
  private getFallbackTracks(): BillboardTrack[] {
    return [
      { rank: 1, title: 'Flowers', artist: 'Miley Cyrus' },
      { rank: 2, title: 'Kill Bill', artist: 'SZA' },
      { rank: 3, title: 'Anti-Hero', artist: 'Taylor Swift' },
      { rank: 4, title: 'Creepin\'', artist: 'Metro Boomin, The Weeknd & 21 Savage' },
      { rank: 5, title: 'Unholy', artist: 'Sam Smith & Kim Petras' },
      { rank: 6, title: 'Rich Flex', artist: 'Drake & 21 Savage' },
      { rank: 7, title: 'Die For You', artist: 'The Weeknd' },
      { rank: 8, title: 'Superhero', artist: 'Metro Boomin, Future & Chris Brown' },
      { rank: 9, title: 'Just Wanna Rock', artist: 'Lil Uzi Vert' },
      { rank: 10, title: 'Allegedly', artist: 'Megan Thee Stallion' },
      { rank: 11, title: 'I\'m Good (Blue)', artist: 'David Guetta & Bebe Rexha' },
      { rank: 12, title: 'Shirt', artist: 'SZA' },
      { rank: 13, title: 'As It Was', artist: 'Harry Styles' },
      { rank: 14, title: 'You Proof', artist: 'Morgan Wallen' },
      { rank: 15, title: 'Calm Down', artist: 'Rema & Selena Gomez' },
      { rank: 16, title: 'Used to This', artist: 'Future' },
      { rank: 17, title: 'Spin Bout U', artist: 'Drake & 21 Savage' },
      { rank: 18, title: 'blind', artist: 'SZA' },
      { rank: 19, title: 'Lavender Haze', artist: 'Taylor Swift' },
      { rank: 20, title: 'Escapism', artist: 'RAYE & 070 Shake' },
    ];
  }

  /**
   * Get Billboard Hot 100 tracks (cached)
   */
  async getBillboardHot100(): Promise<BillboardTrack[]> {
    // Check cache
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.tracks;
    }

    // Fetch new data
    const tracks = await this.scrapeBillboardHot100();
    
    // Update cache
    this.cache = {
      tracks,
      timestamp: Date.now(),
    };

    return tracks;
  }

  /**
   * Match Billboard tracks to Spotify albums
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
