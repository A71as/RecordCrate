import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { spotifyService } from '../services/spotify';
import type { SpotifyUser } from '../types';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { GOOGLE_USER_STORAGE_KEY } from './authConstants';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [isSpotifyLinked, setIsSpotifyLinked] = useState<boolean>(() => spotifyService.isLoggedIn());
  const [loadingSpotify, setLoadingSpotify] = useState(false);

  const isGoogleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const refreshSpotifyUser = useCallback(async () => {
    if (!spotifyService.isLoggedIn()) {
      setSpotifyUser(null);
      setIsSpotifyLinked(false);
      return;
    }

    setLoadingSpotify(true);
    try {
      const currentUser = await spotifyService.getCurrentUser();
      if (currentUser) {
        setSpotifyUser(currentUser);
        setIsSpotifyLinked(true);
      } else {
        setSpotifyUser(null);
        setIsSpotifyLinked(false);
      }
    } catch (error) {
      console.error('Failed to load Spotify user', error);
      setSpotifyUser(null);
      setIsSpotifyLinked(false);
    } finally {
      setLoadingSpotify(false);
    }
  }, []);

  useEffect(() => {
    if (spotifyService.isLoggedIn()) {
      void refreshSpotifyUser();
    } else {
      setSpotifyUser(null);
      setIsSpotifyLinked(false);
    }
  }, [refreshSpotifyUser]);


  const linkSpotifyAccount = useCallback(() => {
    window.location.href = spotifyService.getAuthUrl();
  }, []);

  const logout = useCallback(() => {
    spotifyService.logout();
    setSpotifyUser(null);
    setIsSpotifyLinked(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      spotifyUser,
      isSpotifyLinked,
      loadingSpotify,
      isGoogleConfigured,
      linkSpotifyAccount,
      logout,
      refreshSpotifyUser,
    }),
    [
      spotifyUser,
      isSpotifyLinked,
      loadingSpotify,
      linkSpotifyAccount,
      logout,
      refreshSpotifyUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
