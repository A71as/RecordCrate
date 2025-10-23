import React, { useRef, useEffect } from 'react';
import { AlbumCard } from './AlbumCard';
import type { SpotifyAlbum } from '../types';

interface SearchResultsProps {
    results: SpotifyAlbum[];
    query: string;
    hasSearched: boolean;
    isLoading: boolean;
    error: string | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    query,
    hasSearched,
    isLoading,
    error
}) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef<boolean>(false);
    const scrollIntervalRef = useRef<number | null>(null);

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const startContinuousScroll = (direction: 'left' | 'right') => {
        if (isScrollingRef.current) return;
        
        isScrollingRef.current = true;
        const scrollFn = direction === 'left' ? scrollLeft : scrollRight;
        
        // Initial scroll
        scrollFn();
        
        // Continue scrolling while button is held
        scrollIntervalRef.current = window.setInterval(scrollFn, 200);
    };

    const stopContinuousScroll = () => {
        isScrollingRef.current = false;
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, []);
    // Show error if there's an error
    if (error) {
        return (
            <div id="search-error" className="error" role="alert">
                Error: {error}
            </div>
        );
    }

    // Show "no results" message if search was performed but no results found
    if (!isLoading && results.length === 0 && hasSearched) {
        return (
            <div className="no-results">
                <p>No albums found for "{query}". Try a different search term.</p>
            </div>
        );
    }

    // Show results if we have them
    if (results.length > 0) {
        return (
            <div className="search-results">
                <div className="carousel-header">
                    <h2>Albums ({results.length})</h2>
                    {results.length > 3 && (
                        <div className="carousel-controls">
                            <button 
                                className="carousel-btn carousel-btn-left" 
                                onMouseDown={() => startContinuousScroll('left')}
                                onMouseUp={stopContinuousScroll}
                                onMouseLeave={stopContinuousScroll}
                                onTouchStart={() => startContinuousScroll('left')}
                                onTouchEnd={stopContinuousScroll}
                                aria-label="Scroll left"
                            >
                                ←
                            </button>
                            <button 
                                className="carousel-btn carousel-btn-right" 
                                onMouseDown={() => startContinuousScroll('right')}
                                onMouseUp={stopContinuousScroll}
                                onMouseLeave={stopContinuousScroll}
                                onTouchStart={() => startContinuousScroll('right')}
                                onTouchEnd={stopContinuousScroll}
                                aria-label="Scroll right"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
                <div className="album-carousel" ref={carouselRef}>
                    {results.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Show nothing if no search has been performed or still loading
    return null;
};