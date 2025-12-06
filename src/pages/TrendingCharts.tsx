import React, { useEffect } from 'react';
import { useBillboardInfiniteScroll } from '../hooks/useBillboardInfiniteScroll';
import { BillboardTrackList } from '../components/BillboardTrackList';
import { billboardService } from '../services/billboard';
import '../styles/pages/TrendingCharts.css';

export const TrendingCharts: React.FC = () => {
  const billboardData = useBillboardInfiniteScroll();

  // Prefetch Billboard data on mount to warm up cache
  useEffect(() => {
    billboardService.getBillboardHot100().catch(err => {
      console.warn('Prefetch failed:', err);
    });
  }, []);

  return (
    <div className="trending-charts-page">
      <div className="container">
        <header className="trending-charts-header">
          <h1>Trending Charts</h1>
          <p>
            Explore the hottest tracks across all genres, ranked by current popularity.
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
            <h3>Error Loading Chart Data</h3>
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

export default TrendingCharts;