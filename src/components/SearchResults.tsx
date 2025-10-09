import React from 'react';
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
                <h2>Results ({results.length})</h2>
                <div className="album-grid">
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