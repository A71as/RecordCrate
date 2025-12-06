import React from 'react';

export const TrackListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem',
            background: 'var(--panel-bg)',
            borderRadius: '8px',
            border: '1px solid var(--panel-border)'
          }}
        >
          <div className="skeleton" style={{ width: '24px', height: '1em' }} />
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '6px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '0.25rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
          <div className="skeleton" style={{ width: '50px', height: '1em' }} />
        </div>
      ))}
    </div>
  );
};
