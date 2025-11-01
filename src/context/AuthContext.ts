import { createContext } from 'react';
import type { GoogleUser, SpotifyUser } from '../types';

export interface AuthContextValue {
  googleUser: GoogleUser | null;
  spotifyUser: SpotifyUser | null;
  isGoogleLoggedIn: boolean;
  isSpotifyLinked: boolean;
  loadingSpotify: boolean;
  isGoogleConfigured: boolean;
  loginWithGoogle: (credential: string) => void;
  linkSpotifyAccount: () => void;
  logout: () => void;
  refreshSpotifyUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
