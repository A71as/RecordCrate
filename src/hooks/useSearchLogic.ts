import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpotify } from './useSpotify';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types';
import type { SearchResult } from '../components/SearchDropdown';

// Function to calculate relevance score for search results
const calculateRelevanceScore = (searchQuery: string, result: SearchResult): number => {
    const query = searchQuery.toLowerCase().trim();
    let score = 0;

    if (result.type === 'album') {
        const album = result.data;
        const albumName = album.name.toLowerCase();
        const artistName = album.artists[0]?.name.toLowerCase() || '';

        // Exact match gets highest score
        if (albumName === query) score += 100;
        else if (albumName.startsWith(query)) score += 80;
        else if (albumName.includes(query)) score += 60;

        // Artist name match
        if (artistName === query) score += 90;
        else if (artistName.startsWith(query)) score += 70;
        else if (artistName.includes(query)) score += 50;

        // Popularity bonus (if available)
        if (album.popularity) score += album.popularity * 0.1;

    } else if (result.type === 'artist') {
        const artist = result.data;
        const artistName = artist.name.toLowerCase();

        // Exact match gets highest score
        if (artistName === query) score += 100;
        else if (artistName.startsWith(query)) score += 80;
        else if (artistName.includes(query)) score += 60;

        // Popularity bonus (if available)
        if (artist.popularity) score += artist.popularity * 0.1;
    } else if (result.type === 'track') {
        const track = result.data;
        const trackName = track.name.toLowerCase();
        const artistName = track.artists[0]?.name.toLowerCase() || '';

        // Exact match gets highest score
        if (trackName === query) score += 100;
        else if (trackName.startsWith(query)) score += 80;
        else if (trackName.includes(query)) score += 60;

        // Artist name match
        if (artistName === query) score += 90;
        else if (artistName.startsWith(query)) score += 70;
        else if (artistName.includes(query)) score += 50;

        // Track popularity is not available in Spotify API, so no bonus here
    }

    return score;
};

interface UseSearchLogicProps {
    onAlbumSelect?: (album: SpotifyAlbum) => void;
    onArtistSelect?: (artist: SpotifyArtist) => void;
    onTrackSelect?: (track: SpotifyTrack) => void;
}

export const useSearchLogic = (props?: UseSearchLogicProps) => {
    const [query, setQuery] = useState('');
    const [albumResults, setAlbumResults] = useState<SpotifyAlbum[]>([]);
    const [artistResults, setArtistResults] = useState<SpotifyArtist[]>([]);
    const [trackResults, setTrackResults] = useState<SpotifyTrack[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [dropdownSuggestions, setDropdownSuggestions] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [hasSearched, setHasSearched] = useState(false);

    const { loading, error: spotifyError, searchAlbums, searchArtists, searchTracks } = useSpotify();
    const debounceTimeoutRef = useRef<number | undefined>(undefined);
    const currentQueryRef = useRef<string>('');
    const blurTimeoutRef = useRef<number | undefined>(undefined);
    const isKeyboardActionRef = useRef<boolean>(false);
    const searchInitiatedRef = useRef<boolean>(false);

    // Debounced search for dropdown suggestions with caching
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Update current query ref
        currentQueryRef.current = query;
        
        // Reset search initiated flag when user starts typing again
        searchInitiatedRef.current = false;

        if (query.trim().length >= 1) {
            debounceTimeoutRef.current = window.setTimeout(async () => {
                // Prevent race conditions - only proceed if query hasn't changed
                if (currentQueryRef.current !== query) return;

                try {
                    // Search albums, artists, and tracks simultaneously
                    const [albums, artists, tracks] = await Promise.all([
                        searchAlbums(query),
                        searchArtists(query),
                        searchTracks(query)
                    ]);

                    // Double-check query hasn't changed during async operation
                    if (currentQueryRef.current !== query) return;

                    // Convert to unified search results
                    const albumResults: SearchResult[] = albums.map(album => ({
                        type: 'album' as const,
                        data: album
                    }));

                    const artistResults: SearchResult[] = artists.map(artist => ({
                        type: 'artist' as const,
                        data: artist
                    }));

                    const trackResults: SearchResult[] = tracks.map(track => ({
                        type: 'track' as const,
                        data: track
                    }));

                    // Combine all results and sort by relevance score
                    const allResults = [...albumResults, ...artistResults, ...trackResults];
                    const scoredResults = allResults
                        .map(result => ({
                            result,
                            score: calculateRelevanceScore(query, result)
                        }))
                        .sort((a, b) => b.score - a.score) // Sort by score descending
                        .slice(0, 5) // Limit to top 5 most relevant results
                        .map(item => item.result);

                    // Final check before updating state
                    if (currentQueryRef.current === query && query.trim().length >= 1 && !searchInitiatedRef.current) {
                        setDropdownSuggestions(scoredResults);
                        setShowDropdown(scoredResults.length > 0);
                    }
                } catch {
                    // Only update error state if query hasn't changed and no search initiated
                    if (currentQueryRef.current === query && !searchInitiatedRef.current) {
                        setDropdownSuggestions([]);
                        setShowDropdown(false);
                    }
                }
            }, 150);
        } else {
            // Immediately hide dropdown for short queries
            setDropdownSuggestions([]);
            setShowDropdown(false);
            if (query.trim().length === 0) {
                setHasSearched(false);
                setAlbumResults([]);
                setArtistResults([]);
                setTrackResults([]);
            }
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [query, searchAlbums, searchArtists, searchTracks]);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setLocalError('Please enter a search term');
            return;
        }

        // Set flag to prevent dropdown from reappearing due to delayed suggestions
        searchInitiatedRef.current = true;

        setLocalError(null);
        setHasSearched(true);
        setShowDropdown(false); // Hide the dropdown
        setDropdownSuggestions([]); // Clear suggestions to prevent re-showing
        setSelectedIndex(-1); // Reset selection

        // Search both albums and artists simultaneously
        const [albums, artists] = await Promise.all([
            searchAlbums(query),
            searchArtists(query)
        ]);

        setAlbumResults(albums);
        setArtistResults(artists);
    }, [query, searchAlbums, searchArtists]);

    const handleSuggestionSelect = useCallback((result: SearchResult) => {
        if (result.type === 'album') {
            // Handle album selection
            if (props?.onAlbumSelect) {
                props.onAlbumSelect(result.data);
            } else {
                // Fallback: update search results
                setQuery(result.data.name);
                setAlbumResults([result.data]);
                setArtistResults([]);
                setTrackResults([]);
                setHasSearched(true);
            }
        } else if (result.type === 'artist') {
            // Handle artist selection
            if (props?.onArtistSelect) {
                props.onArtistSelect(result.data as SpotifyArtist);
            } else {
                // Fallback: update search results
                setQuery(result.data.name);
                setArtistResults([result.data as SpotifyArtist]);
                setAlbumResults([]);
                setTrackResults([]);
                setHasSearched(true);
            }
        } else if (result.type === 'track') {
            // Handle track selection
            if (props?.onTrackSelect) {
                props.onTrackSelect(result.data as SpotifyTrack);
            } else {
                // Fallback: update search results
                setQuery(result.data.name);
                setTrackResults([result.data as SpotifyTrack]);
                setAlbumResults([]);
                setArtistResults([]);
                setHasSearched(true);
            }
        }

        // Always close dropdown
        setShowDropdown(false);
        setSelectedIndex(-1);
    }, [props]);

    const handleClear = useCallback(() => {
        setQuery('');
        setAlbumResults([]);
        setArtistResults([]);
        setTrackResults([]);
        setLocalError(null);
        setDropdownSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        setHasSearched(false);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                if (showDropdown && dropdownSuggestions.length > 0) {
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < dropdownSuggestions.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                if (showDropdown && dropdownSuggestions.length > 0) {
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : dropdownSuggestions.length - 1
                    );
                }
                break;
            case 'Enter':
                e.preventDefault();
                isKeyboardActionRef.current = true; // Mark as keyboard action
                if (showDropdown && selectedIndex >= 0 && selectedIndex < dropdownSuggestions.length && dropdownSuggestions[selectedIndex]) {
                    // User has selected a suggestion - use it
                    handleSuggestionSelect(dropdownSuggestions[selectedIndex]);
                } else {
                    // No suggestion selected or no dropdown - perform search
                    handleSearch();
                }
                break;
            case 'Escape':
                if (showDropdown) {
                    isKeyboardActionRef.current = true; // Mark as keyboard action
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                }
                break;
        }
    }, [showDropdown, dropdownSuggestions, selectedIndex, handleSearch, handleSuggestionSelect]);

    const handleInputFocus = useCallback(() => {
        if (dropdownSuggestions.length > 0 && query.trim().length >= 1) {
            setShowDropdown(true);
        }
    }, [dropdownSuggestions, query]);

    const handleInputBlur = useCallback(() => {
        // Clear any existing timeout
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
        }
        
        // If this blur was caused by a keyboard action (like Enter), don't delay
        if (isKeyboardActionRef.current) {
            isKeyboardActionRef.current = false; // Reset flag
            setShowDropdown(false);
            return;
        }
        
        // Use a delay for mouse actions to prevent flickering when clicking on dropdown items
        blurTimeoutRef.current = setTimeout(() => {
            setShowDropdown(false);
            blurTimeoutRef.current = undefined;
        }, 200);
    }, []);

    return {
        // State
        query,
        albumResults,
        artistResults,
        trackResults,
        localError,
        dropdownSuggestions,
        showDropdown,
        selectedIndex,
        hasSearched,
        loading,
        spotifyError,

        // Actions
        setQuery,
        setSelectedIndex,
        setShowDropdown,
        handleSearch,
        handleSuggestionSelect,
        handleClear,
        handleKeyDown,
        handleInputFocus,
        handleInputBlur
    };
};
