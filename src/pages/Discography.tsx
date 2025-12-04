import React from 'react';
import { useBillboardInfiniteScroll } from '../hooks/useBillboardInfiniteScroll';
import { BillboardTrackList } from '../components/BillboardTrackList';
import '../styles/pages/Discography.css';

export const Discography: React.FC = () => {
  const billboardData = useBillboardInfiniteScroll();

  return (
    <div className="discography-page">
      <div className="container">
        <header className="discography-header">
          <h1>Billboard Hot 100</h1>
          <p>
            Explore the current Billboard Hot 100 chart. The hottest tracks across all genres, ranked by popularity.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            Tracks not available on Spotify are shown with limited information
          </p>
        </header>

        {billboardData.error && (
          <div style={{ 
            padding: '2rem', 
            background: 'var(--error-bg, #fee)', 
            border: '1px solid var(--error-border, #fcc)',
            borderRadius: '8px',
            margin: '2rem 0',
            color: 'var(--error-text, #c00)'
          }}>
            <h3>Error Loading Billboard Data</h3>
            <p>{billboardData.error}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Please check the browser console for more details.
            </p>
          </div>
        )}

        <BillboardTrackList
          tracks={billboardData.tracks}
          loading={billboardData.loading}
          hasMore={billboardData.hasMore}
          loadMoreRef={billboardData.loadMoreRef}
          total={billboardData.total}
        />
      </div>
    </div>
  );
};