import { useState, useEffect, useCallback, useRef } from 'react';
import { billboardService } from '../services/billboard';
import type { SpotifyTrack } from '../types';

interface BillboardTrack {
  rank: number;
  title: string;
  artist: string;
  isSpotifyMatched?: boolean;
}

export const useBillboardInfiniteScroll = () => {
  const [tracks, setTracks] = useState<(SpotifyTrack | BillboardTrack)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Initial load - increased batch size for faster perceived loading
  useEffect(() => {
    const initialLoad = async () => {
      if (!isInitialLoadRef.current) return;
      isInitialLoadRef.current = false;
      
      setLoading(true);
      setError(null);

      try {
        // Load first 30 tracks (increased from 20) for better initial experience
        const result = await billboardService.getBillboardTracksWithSpotifyData(0, 30);
        setTracks(result.tracks);
        setHasMore(result.hasMore);
        setTotal(result.total);
        setPage(1);
      } catch (err) {
        console.error('Failed to load Billboard tracks:', err);
        setError('Failed to load Billboard Hot 100. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []);

  // Load more function - increased batch size
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      // Load 30 tracks at a time (increased from 20) for smoother scrolling
      const result = await billboardService.getBillboardTracksWithSpotifyData(page, 30);
      setTracks((prev) => [...prev, ...result.tracks]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to load more tracks:', err);
      setError('Failed to load more tracks');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '600px', // Increased from 400px - start loading earlier
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadMore]);

  return {
    tracks,
    loading,
    error,
    hasMore,
    loadMoreRef,
    total,
  };
};
