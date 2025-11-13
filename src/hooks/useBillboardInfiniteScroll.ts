import { useState, useEffect, useCallback, useRef } from 'react';
import { billboardService } from '../services/billboard';
import type { SpotifyTrack } from '../types';

export const useBillboardInfiniteScroll = () => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await billboardService.getBillboardTracksWithSpotifyData(0, 20);
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

  // Load more function
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const result = await billboardService.getBillboardTracksWithSpotifyData(page, 20);
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
        rootMargin: '400px', // Start loading before user reaches the bottom
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
