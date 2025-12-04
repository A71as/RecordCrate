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