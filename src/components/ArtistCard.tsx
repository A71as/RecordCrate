import React from 'react';
import type { SpotifyArtist } from '../types';
import '../styles/components/ArtistCard.css';

interface ArtistCardProps {
  artist: SpotifyArtist;
  onClick?: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  const imageUrl = artist.images[0]?.url || '/placeholder-artist.png';

  return (
    <div className="artist-card" onClick={onClick}>
      <div className="artist-image">
        <img src={imageUrl} alt={artist.name} />
      </div>
      <div className="artist-info">
        <h3 className="artist-name">{artist.name}</h3>
        <p className="artist-genres">
          {artist.genres.slice(0, 2).join(', ') || 'Various'}
        </p>
        <div className="artist-popularity">
          <span className="popularity-label">Popularity:</span>
          <div className="popularity-bar">
            <div
              className="popularity-fill"
              style={{ width: `${artist.popularity}%` }}
            />
          </div>
          <span className="popularity-value">{artist.popularity}%</span>
        </div>
      </div>
    </div>
  );
};