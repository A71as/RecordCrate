import axios from 'axios';
import type { SpotifyAlbum, SpotifyArtist } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
    
    return this.accessToken!;
  }

  async searchAlbums(query: string): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();
    
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=album&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.albums.items;
  }

  async getAlbum(id: string): Promise<SpotifyAlbum> {
    const token = await this.getAccessToken();
    
    const response = await axios.get(
      `https://api.spotify.com/v1/albums/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  async getNewReleases(limit: number = 20): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();
    
    const response = await axios.get(
      `https://api.spotify.com/v1/browse/new-releases?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.albums.items;
  }

  async getNewReleasesByTimeframe(timeframe: 'week' | 'month' | 'year'): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();
    
    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const startYear = startDate.getFullYear();
    const endYear = now.getFullYear();

    // Search for albums released in the timeframe
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=year:${startYear}-${endYear}&type=album&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Filter albums by exact date range
    const albums = response.data.albums.items.filter((album: SpotifyAlbum) => {
      const releaseDate = new Date(album.release_date);
      return releaseDate >= startDate && releaseDate <= now;
    });

    // Sort by release date (newest first)
    return albums.sort((a: SpotifyAlbum, b: SpotifyAlbum) => 
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    ).slice(0, 20);
  }

  async getPopularAlbums(): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();
    
    // Get featured playlists which often contain popular albums
    const playlistsResponse = await axios.get(
      'https://api.spotify.com/v1/browse/featured-playlists?limit=10',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const albums: SpotifyAlbum[] = [];
    const albumIds = new Set<string>();

    // Get tracks from featured playlists and extract unique albums
    for (const playlist of playlistsResponse.data.playlists.items.slice(0, 3)) {
      try {
        const tracksResponse = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        for (const item of tracksResponse.data.items) {
          if (item.track && item.track.album && !albumIds.has(item.track.album.id)) {
            albumIds.add(item.track.album.id);
            albums.push(item.track.album);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch playlist tracks:', error);
      }
    }

    return albums.slice(0, 20);
  }

  async getTopArtists(): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken();
    
    // Search for popular artists across different genres
    const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz'];
    const artists: SpotifyArtist[] = [];
    const artistIds = new Set<string>();

    for (const genre of genres) {
      try {
        const response = await axios.get(
          `https://api.spotify.com/v1/search?q=genre:${genre}&type=artist&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        for (const artist of response.data.artists.items) {
          if (!artistIds.has(artist.id)) {
            artistIds.add(artist.id);
            artists.push(artist);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${genre} artists:`, error);
      }
    }

    // Sort by popularity and return top 20
    return artists
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20);
  }

  // Mock functions for personal data (would require user authentication in real app)
  async getPersonalTopAlbums(timeframe: 'week' | '6months' | 'alltime'): Promise<SpotifyAlbum[]> {
    // In a real app, this would use the user's listening history
    // For now, return popular albums as a placeholder
    console.log(`Getting personal top albums for ${timeframe} (mock data)`);
    return this.getPopularAlbums();
  }

  async getPersonalTopArtists(timeframe: 'week' | '6months' | 'alltime'): Promise<SpotifyArtist[]> {
    // In a real app, this would use the user's listening history
    // For now, return top artists as a placeholder
    console.log(`Getting personal top artists for ${timeframe} (mock data)`);
    return this.getTopArtists();
  }
}

export const spotifyService = new SpotifyService();