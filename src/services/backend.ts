import { logger } from '../utils/logger';

export type SaveReviewPayload = {
  userSpotifyId: string;
  albumId: string;
  overallRating: number;
  baseOverallRating?: number;
  adjustedOverallRating?: number;
  scoreModifiers?: {
    emotionalStoryConnection?: number;
    cohesionAndFlow?: number;
    artistIdentityOriginality?: number;
    visualAestheticEcosystem?: number;
  };
  songRatings?: Array<{ trackId: string; trackName: string; rating: number }>;
  writeup?: string;
  albumMeta?: { name?: string; artists?: string[]; image?: string };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  logger.error('[backend] VITE_API_BASE_URL is not defined! Reviews will fail.');
}
logger.debug('[backend] Using API_BASE:', API_BASE);

async function jsonFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  logger.debug(`[backend] Fetching: ${API_BASE}${path}`);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let errorMessage = `API ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = res.statusText || errorMessage;
    }
    logger.error(`[backend] Request failed: ${path}`, errorMessage);
    throw new Error(errorMessage);
  }
  return res.json();
}

export const backend = {
  async syncUser(user: { spotifyId: string; displayName?: string; avatarUrl?: string }) {
    return jsonFetch('/api/users/sync', { method: 'POST', body: JSON.stringify(user) });
  },
  async saveReview(payload: SaveReviewPayload) {
    return jsonFetch('/api/reviews', { method: 'POST', body: JSON.stringify(payload) });
  },
  async deleteReview(userSpotifyId: string, albumId: string) {
    return jsonFetch(`/api/reviews/${userSpotifyId}/${albumId}`, { method: 'DELETE' });
  },
  async getAlbumReviews(albumId: string) {
    return jsonFetch(`/api/reviews/album/${albumId}`);
  },
  async getUserReviews(spotifyId: string, albumId?: string) {
    const p = albumId ? `/api/reviews/user/${spotifyId}?albumId=${encodeURIComponent(albumId)}` : `/api/reviews/user/${spotifyId}`;
    return jsonFetch(p);
  },
  async getAllReviews() {
    return jsonFetch('/api/reviews');
  },
};
