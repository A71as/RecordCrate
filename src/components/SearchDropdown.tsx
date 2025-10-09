import { forwardRef } from 'react';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types';

export type SearchResult =
    | { type: 'album'; data: SpotifyAlbum }
    | { type: 'artist'; data: SpotifyArtist }
    | { type: 'track'; data: SpotifyTrack };

interface SearchDropdownProps {
    suggestions: SearchResult[];
    isVisible: boolean;
    selectedIndex: number;
    onSuggestionSelect: (result: SearchResult) => void;
    onHover: (index: number) => void;
}

export const SearchDropdown = forwardRef<HTMLDivElement, SearchDropdownProps>(({
    suggestions,
    isVisible,
    selectedIndex,
    onSuggestionSelect,
    onHover
}, ref) => {
    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            id="search-dropdown"
            className="search-dropdown"
            role="listbox"
            aria-label="Search suggestions"
        >
            {suggestions.map((result, index) => {
                const isAlbum = result.type === 'album';
                const isArtist = result.type === 'artist';
                const isTrack = result.type === 'track';
                const item = result.data;
                const id = item.id;
                const name = item.name;

                let imageUrl: string;
                let subtitle: string;
                let typeIcon: string;
                let imageClass: string;

                if (isAlbum) {
                    const album = item as SpotifyAlbum;
                    imageUrl = album.images?.[0]?.url || '/placeholder-album.png';
                    subtitle = album.artists.map(artist => artist.name).join(', ');
                    typeIcon = '♪';
                    imageClass = 'dropdown-album-image';
                } else if (isArtist) {
                    const artist = item as SpotifyArtist;
                    imageUrl = artist.images?.[0]?.url || '/placeholder-artist.png';
                    subtitle = 'Artist';
                    typeIcon = '👤';
                    imageClass = 'dropdown-artist-image';
                } else {
                    const track = item as SpotifyTrack;
                    imageUrl = ''; // No image for tracks
                    subtitle = track.artists.map(artist => artist.name).join(', ');
                    typeIcon = '🎵';
                    imageClass = 'dropdown-track-image';
                }

                return (
                    <div
                        key={`${result.type}-${id}`}
                        className={`search-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                        role="option"
                        aria-selected={index === selectedIndex ? "true" : "false"}
                        onMouseDown={() => onSuggestionSelect(result)}
                        onMouseEnter={() => onHover(index)}
                    >
                        {isTrack ? (
                            <div className={imageClass}>
                                🎵
                            </div>
                        ) : (
                            <img
                                src={imageUrl}
                                alt={name}
                                className={imageClass}
                            />
                        )}
                        <div className="dropdown-item-info">
                            <div className="dropdown-item-name">
                                {name}
                                <span className="dropdown-item-type">
                                    {typeIcon}
                                </span>
                            </div>
                            <div className="dropdown-item-subtitle">
                                {subtitle}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

SearchDropdown.displayName = 'SearchDropdown';