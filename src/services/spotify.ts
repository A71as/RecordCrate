import axios from 'axios';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack, SpotifyUser } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
  'user-read-recently-played'
].join(' ');

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private userAccessToken: string | null = null;
  private refreshToken: string | null = null;

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

  async searchArtists(query: string): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=artist&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.artists.items;
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.tracks.items;
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

  async getArtist(id: string): Promise<SpotifyArtist> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  async getArtistAlbums(id: string): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.items;
  }

  async getArtistTopTracks(id: string): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.tracks;
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

  // OAuth Authentication Methods
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string, refresh_token: string }> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          },
        }
      );

      this.userAccessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      // Store tokens in localStorage for persistence
      if (this.userAccessToken) localStorage.setItem('spotify_access_token', this.userAccessToken);
      if (this.refreshToken) localStorage.setItem('spotify_refresh_token', this.refreshToken);

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      };
    } catch (error: any) {
      console.error('Token exchange error:', error.response?.data || error.message);
      if (error.response?.data?.error === 'invalid_grant') {
        throw new Error('Invalid redirect URI or authorization code. Please check your Spotify app settings.');
      }
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('spotify_refresh_token');
    }

    if (!this.refreshToken) return null;

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          },
        }
      );

      this.userAccessToken = response.data.access_token;
      if (this.userAccessToken) localStorage.setItem('spotify_access_token', this.userAccessToken);

      return this.userAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.logout();
      return null;
    }
  }

  async getUserAccessToken(): Promise<string | null> {
    if (this.userAccessToken) return this.userAccessToken;

    const storedToken = localStorage.getItem('spotify_access_token');
    if (storedToken) {
      this.userAccessToken = storedToken;
      return storedToken;
    }

    return await this.refreshAccessToken();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('spotify_access_token');
  }

  logout(): void {
    this.userAccessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  }

  // User Profile Methods
  async getCurrentUser(): Promise<SpotifyUser | null> {
    const token = await this.getUserAccessToken();
    if (!token) return null;

    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      await this.refreshAccessToken();
      return null;
    }
  }

  // Album Methods
  async getAlbumWithTracks(id: string): Promise<SpotifyAlbum> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/albums/${id}?market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `https://api.spotify.com/v1/albums/${albumId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.items;
  }

  // Enhanced personal data methods with real user data
  async getPersonalTopAlbums(timeframe: 'week' | '6months' | 'alltime'): Promise<SpotifyAlbum[]> {
    const token = await this.getUserAccessToken();
    if (!token) {
      console.log(`Getting personal top albums for ${timeframe} (mock data - not logged in)`);
      return this.getPopularAlbums();
    }

    try {
      let timeRange = 'medium_term';
      switch (timeframe) {
        case 'week':
          timeRange = 'short_term';
          break;
        case 'alltime':
          timeRange = 'long_term';
          break;
      }

      const response = await axios.get(
        `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Extract unique albums from top tracks
      const albums: SpotifyAlbum[] = [];
      const albumIds = new Set<string>();

      for (const track of response.data.items) {
        if (!albumIds.has(track.album.id)) {
          albumIds.add(track.album.id);
          albums.push(track.album);
        }
      }

      return albums.slice(0, 20);
    } catch (error) {
      console.error('Failed to get personal top albums:', error);
      return this.getPopularAlbums();
    }
  }

  async getPersonalTopArtists(timeframe: 'week' | '6months' | 'alltime'): Promise<SpotifyArtist[]> {
    const token = await this.getUserAccessToken();
    if (!token) {
      console.log(`Getting personal top artists for ${timeframe} (mock data - not logged in)`);
      return this.getTopArtists();
    }

    try {
      let timeRange = 'medium_term';
      switch (timeframe) {
        case 'week':
          timeRange = 'short_term';
          break;
        case 'alltime':
          timeRange = 'long_term';
          break;
      }

      const response = await axios.get(
        `https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.items;
    } catch (error) {
      console.error('Failed to get personal top artists:', error);
      return this.getTopArtists();
    }
  }
}

export const spotifyService = new SpotifyService();