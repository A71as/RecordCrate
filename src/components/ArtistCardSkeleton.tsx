import React from 'react';
import '../styles/components/ArtistCardSkeleton.css';

export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="artist-card skeleton">
      <div className="artist-image skeleton-shimmer"></div>
      <div className="artist-name skeleton-text skeleton-shimmer"></div>
    </div>
  );
};
