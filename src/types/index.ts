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

export interface Review {
  id: string;
  albumId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  album?: SpotifyAlbum;
}

export interface UserProfile {
  id: string;
  name: string;
  reviews: Review[];
  favoriteAlbums: SpotifyAlbum[];
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