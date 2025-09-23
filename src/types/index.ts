export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  release_date: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  popularity?: number;
  tracks?: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  explicit: boolean;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  popularity: number;
  genres: string[];
  external_urls: {
    spotify: string;
  };
}

export interface SongRating {
  trackId: string;
  trackName: string;
  rating: number;
}

export interface AlbumReview {
  id: string;
  albumId: string;
  userId: string;
  overallRating: number;
  songRatings: SongRating[];
  writeup: string;
  createdAt: string;
  updatedAt: string;
  album?: SpotifyAlbum;
}

export interface Review {
  id: string;
  albumId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  album?: SpotifyAlbum;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  country: string;
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  reviews: Review[];
  albumReviews: AlbumReview[];
  favoriteAlbums: SpotifyAlbum[];
  spotifyUser?: SpotifyUser;
}

export type FilterType = 
  | 'new-releases-week'
  | 'new-releases-month'
  | 'new-releases-year'
  | 'popular-week'
  | 'popular-month'
  | 'popular-year'
  | 'personal-week'
  | 'personal-6months'
  | 'personal-alltime';

export interface FilterOption {
  id: FilterType;
  label: string;
  category: 'releases' | 'popular' | 'personal';
}