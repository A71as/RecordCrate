import React from 'react';

export const ReviewCardSkeleton: React.FC = () => {
  return (
    <div className="review-card skeleton-card" style={{ 
      padding: '1.5rem',
      background: 'var(--panel-bg)',
      borderRadius: '16px',
      border: '1px solid var(--panel-border)'
    }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '12px' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-heading" style={{ width: '60%', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100px', height: '40px', borderRadius: '8px', marginBottom: '1rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '0.5rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: '0.5rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
    </div>
  );
};

export const ReviewGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </>
  );
};
