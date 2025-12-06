import React from 'react';
import '../styles/components/AlbumCardSkeleton.css';

export const AlbumCardSkeleton: React.FC = () => {
  return (
    <div className="album-card-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-artist"></div>
        <div className="skeleton-rating"></div>
      </div>
    </div>
  );
};

export const AlbumGridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div className="album-grid">
      {Array.from({ length: count }).map((_, index) => (
        <AlbumCardSkeleton key={index} />
      ))}
    </div>
  );
};
