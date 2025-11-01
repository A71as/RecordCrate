import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { spotifyService } from '../services/spotify';
import type { GoogleUser, SpotifyUser } from '../types';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { GOOGLE_USER_STORAGE_KEY } from './authConstants';

interface GoogleCredentialPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const stored = localStorage.getItem(GOOGLE_USER_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as GoogleUser) : null;
    } catch (error) {
      console.error('Failed to parse stored Google user', error);
      return null;
    }
  });
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

  const loginWithGoogle = useCallback((credential: string) => {
    try {
      const payload = jwtDecode<GoogleCredentialPayload>(credential);
      if (!payload?.sub || !payload.email) {
        throw new Error('Invalid credential payload');
      }

      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        picture: payload.picture,
      };

      setGoogleUser(user);
      localStorage.setItem(GOOGLE_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to process Google login', error);
    }
  }, []);

  const linkSpotifyAccount = useCallback(() => {
    window.location.href = spotifyService.getAuthUrl();
  }, []);

  const logout = useCallback(() => {
    setGoogleUser(null);
    localStorage.removeItem(GOOGLE_USER_STORAGE_KEY);
    spotifyService.logout();
    setSpotifyUser(null);
    setIsSpotifyLinked(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      googleUser,
      spotifyUser,
      isGoogleLoggedIn: !!googleUser,
      isSpotifyLinked,
      loadingSpotify,
      isGoogleConfigured,
      loginWithGoogle,
      linkSpotifyAccount,
      logout,
      refreshSpotifyUser,
    }),
    [
      googleUser,
      spotifyUser,
      isSpotifyLinked,
      loadingSpotify,
      isGoogleConfigured,
      loginWithGoogle,
      linkSpotifyAccount,
      logout,
      refreshSpotifyUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
