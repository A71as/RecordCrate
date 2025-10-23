import { useRef, useCallback } from 'react';
import type { SpotifyAlbum } from '../types';

export const useSearchCache = () => {
    const searchCacheRef = useRef<Map<string, SpotifyAlbum[]>>(new Map());

    const getCachedResults = useCallback((query: string): SpotifyAlbum[] | null => {
        const searchKey = query.toLowerCase().trim();
        return searchCacheRef.current.get(searchKey) || null;
    }, []);

    const setCachedResults = useCallback((query: string, results: SpotifyAlbum[]) => {
        const searchKey = query.toLowerCase().trim();

        // Limit cache size to 50 entries
        if (searchCacheRef.current.size >= 50) {
            // Remove oldest entry when cache is full
            const firstKey = searchCacheRef.current.keys().next().value;
            if (firstKey) {
                searchCacheRef.current.delete(firstKey);
            }
        }

        searchCacheRef.current.set(searchKey, results);
    }, []);

    const clearCache = useCallback(() => {
        searchCacheRef.current.clear();
    }, []);

    return {
        getCachedResults,
        setCachedResults,
        clearCache
    };
};