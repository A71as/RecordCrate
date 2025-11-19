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

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

async function jsonFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
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
  async processNaturalLanguageSearch(query: string) {
    return jsonFetch('/api/search/natural-language', { 
      method: 'POST', 
      body: JSON.stringify({ query }) 
    });
  },
};
