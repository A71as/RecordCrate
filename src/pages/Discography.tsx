import React from 'react';
import { useBillboardInfiniteScroll } from '../hooks/useBillboardInfiniteScroll';
import { BillboardTrackList } from '../components/BillboardTrackList';

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