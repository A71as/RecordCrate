import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { spotifyService } from '../services/spotify';
import { logger } from '../utils/logger';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasSpotifyAccess, setHasSpotifyAccess] = useState(false);
  const [loadingSpotify, setLoadingSpotify] = useState(true);

  // Check if we can access Spotify's public API
  useEffect(() => {
    const checkSpotifyAccess = async () => {
      setLoadingSpotify(true);
      try {
        // Try to get an access token for public API access
        const accessToken = await spotifyService.getAccessToken();
        setHasSpotifyAccess(!!accessToken);
      } catch (error) {
        logger.error('Failed to get Spotify access', error);
        setHasSpotifyAccess(false);
      } finally {
        setLoadingSpotify(false);
      }
    };

    checkSpotifyAccess();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      // Auth0 will handle user authentication
      googleUser: null,
      spotifyUser: null,
      isGoogleLoggedIn: false,
      isSpotifyLinked: hasSpotifyAccess,
      loadingSpotify,
      isGoogleConfigured: true, // Auth0 is configured
      loginWithGoogle: () => {}, // Not used with Auth0
      linkSpotifyAccount: () => {}, // Not needed for public API
      logout: () => {}, // Auth0 handles logout
      refreshSpotifyUser: async () => {}, // Not needed for public API
    }),
    [hasSpotifyAccess, loadingSpotify]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
