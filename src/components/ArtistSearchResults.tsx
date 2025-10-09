import React from 'react';
import { ArtistCard } from './ArtistCard';
import type { SpotifyArtist } from '../types';

interface ArtistSearchResultsProps {
    results: SpotifyArtist[];
    query: string;
    hasSearched: boolean;
    isLoading: boolean;
    error: string | null;
}

export const ArtistSearchResults: React.FC<ArtistSearchResultsProps> = ({
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
                <p>No artists found for "{query}". Try a different search term.</p>
            </div>
        );
    }

    // Show results if we have them
    if (results.length > 0) {
        return (
            <div className="search-results">
                <h2>Artists ({results.length})</h2>
                <div className="artist-grid">
                    {results.map((artist) => (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                            onClick={() => {
                                // TODO: Navigate to artist detail page when implemented
                                console.log('Navigate to artist:', artist.id);
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Show nothing if no search has been performed or still loading
    return null;
};