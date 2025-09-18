import React from 'react';
import type { SpotifyAlbum } from '../types';
import { StarRating } from './StarRating';

interface AlbumCardProps {
  album: SpotifyAlbum;
  userRating?: number;
  onClick?: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  userRating,
  onClick,
}) => {
  const imageUrl = album.images[0]?.url || '/placeholder-album.png';
  const artistNames = album.artists.map((artist) => artist.name).join(', ');

  return (
    <div className="album-card" onClick={onClick}>
      <div className="album-image">
        <img src={imageUrl} alt={album.name} />
        {userRating && (
          <div className="rating-overlay">
            <StarRating rating={userRating} readonly size={16} />
          </div>
        )}
      </div>
      <div className="album-info">
        <h3 className="album-title">{album.name}</h3>
        <p className="album-artist">{artistNames}</p>
        <p className="album-year">
          {new Date(album.release_date).getFullYear()}
        </p>
      </div>
    </div>
  );
};