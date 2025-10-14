import { useState, useCallback } from 'react';
import { spotifyService } from '../services/spotify';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack, FilterType } from '../types';

export const useSpotify = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAlbums = useCallback(async (query: string): Promise<SpotifyAlbum[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await spotifyService.searchAlbums(query);
      return results;
    } catch (err) {
      setError('Failed to search albums');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchArtists = useCallback(async (query: string): Promise<SpotifyArtist[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await spotifyService.searchArtists(query);
      return results;
    } catch (err) {
      setError('Failed to search artists');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTracks = useCallback(async (query: string): Promise<SpotifyTrack[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await spotifyService.searchTracks(query);
      return results;
    } catch (err) {
      setError('Failed to search tracks');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlbum = async (id: string): Promise<SpotifyAlbum | null> => {
    setLoading(true);
    setError(null);

    try {
      const album = await spotifyService.getAlbum(id);
      return album;
    } catch (err) {
      setError('Failed to fetch album');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContent = async (filterType: FilterType): Promise<{
    albums: SpotifyAlbum[];
    artists?: SpotifyArtist[];
  }> => {
    setLoading(true);
    setError(null);

    try {
      let albums: SpotifyAlbum[] = [];
      let artists: SpotifyArtist[] = [];

      switch (filterType) {
        case 'new-releases-week':
          albums = await spotifyService.getNewReleasesByTimeframe('week');
          break;
        case 'new-releases-month':
          albums = await spotifyService.getNewReleasesByTimeframe('month');
          break;
        case 'new-releases-year':
          albums = await spotifyService.getNewReleasesByTimeframe('year');
          break;
        case 'popular-week':
        case 'popular-month':
        case 'popular-year':
          albums = await spotifyService.getPopularAlbums();
          break;
        case 'personal-week':
          albums = await spotifyService.getPersonalTopAlbums('week');
          artists = await spotifyService.getPersonalTopArtists('week');
          break;
        case 'personal-6months':
          albums = await spotifyService.getPersonalTopAlbums('6months');
          artists = await spotifyService.getPersonalTopArtists('6months');
          break;
        case 'personal-alltime':
          albums = await spotifyService.getPersonalTopAlbums('alltime');
          artists = await spotifyService.getPersonalTopArtists('alltime');
          break;
        default:
          albums = await spotifyService.getNewReleases();
      }

      return { albums, artists };
    } catch (err) {
      setError('Failed to fetch content');
      return { albums: [], artists: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    searchAlbums,
    searchArtists,
    searchTracks,
    getAlbum,
    getFilteredContent,
  };
};