import { createContext } from 'react';
import type { SpotifyUser } from '../types';

export interface AuthContextValue {
  spotifyUser: SpotifyUser | null;
  isSpotifyLinked: boolean;
  loadingSpotify: boolean;
  linkSpotifyAccount: () => void;
  logout: () => void;
  refreshSpotifyUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
