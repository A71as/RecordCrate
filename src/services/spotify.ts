import axios from 'axios';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack, SpotifyUser } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;


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

  // Additional search helpers used across the app
  async searchArtists(query: string): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.artists.items;
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.tracks.items;
  }

  // Artist-specific endpoints
  async getArtist(id: string): Promise<SpotifyArtist> {
    const token = await this.getAccessToken();
    const response = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getArtistAlbums(id: string): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single,ep&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.items;
  }

  async getArtistTopTracks(id: string, market: string = 'US'): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${id}/top-tracks?market=${market}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.tracks;
  }

  // OAuth Authentication Methods
  getAuthUrl(): string {
    // Prefer the configured REDIRECT_URI, but at runtime fall back to the current origin
    // so local dev always uses the right host/port even if an env var was stale.

    /*const runtimeRedirect = (typeof window !== 'undefined')
      ? (REDIRECT_URI || `${window.location.origin}/callback`)
      : (REDIRECT_URI || 'http://localhost:5173/callback');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: runtimeRedirect,
      show_dialog: 'true'
    });

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
    // Debug: expose the effective redirect URI and final URL to help troubleshoot INVALID_CLIENT errors
    try {
      // eslint-disable-next-line no-console
      console.debug('[spotify] effective redirect_uri:', runtimeRedirect);
      // eslint-disable-next-line no-console
      console.debug('[spotify] auth url:', url);
    } catch (err) {}

    return url;*/
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://dev-g3gfbaps5ypq871s.us.auth0.com/authorize?response_type=code&client_id=njJKNNpKXqX6DW0wOPAF3NkzwN0aED47&connection=spotify&redirect_uri=https%3A%2F%2Flocalhost%2F5179%2Fcallback',
      headers: {}
    };
    axios.request(config)
      .then((response) => {
        return JSON.stringify(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
    return "";

  }

  async exchangeCodeForToken(code: string): Promise<{ access_token: string, refresh_token: string }> {
    // Use the configured REDIRECT_URI, but fall back to the current origin at runtime
    const effectiveRedirect = (typeof window !== 'undefined')
      ? (REDIRECT_URI || `${window.location.origin}/callback`)
      : (REDIRECT_URI || 'http://localhost:5173/callback');

    try {
      // Debug: log the code and redirect used for token exchange
      try { console.debug('[spotify] exchange code:', code); } catch (e) { }
      try { console.debug('[spotify] exchange redirect_uri:', effectiveRedirect); } catch (e) { }

      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: effectiveRedirect,
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
      // Log the full response body when available to help debugging
      console.error('Token exchange error:', error.response?.data || error.message || error);
      // If the Spotify API returns a more descriptive error field, include it
      const respData = error.response?.data;
      if (respData) {
        try { console.debug('[spotify] token exchange response:', respData); } catch (e) { }
      }

      if (respData?.error === 'invalid_grant' || respData?.error_description?.toLowerCase?.().includes('redirect')) {
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