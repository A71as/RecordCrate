import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '../components/SearchInput';
import { SearchDropdown } from '../components/SearchDropdown';
import { SearchResults } from '../components/SearchResults';
import { ArtistSearchResults } from '../components/ArtistSearchResults';
import { TrackSearchResults } from '../components/TrackSearchResults';
import { useSearchLogic } from '../hooks/useSearchLogic';
import { useClickOutside } from '../hooks/useClickOutside';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types';

export const Search: React.FC = () => {
  const navigate = useNavigate();

  const {
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
    setQuery,
    setSelectedIndex,
    setShowDropdown,
    handleSearch,
    handleSuggestionSelect,
    handleClear,
    handleKeyDown,
    handleInputFocus,
    handleInputBlur
  } = useSearchLogic({
    onAlbumSelect: (album: SpotifyAlbum) => {
      navigate(`/album/${album.id}`);
    },
    onArtistSelect: (artist: SpotifyArtist) => {
      navigate(`/artist/${artist.id}`);
    },
    onTrackSelect: (track: SpotifyTrack) => {
      // For now, just log the track selection and play preview if available
      console.log('Selected track:', track.name, 'by', track.artists.map(a => a.name).join(', '));
      if (track.preview_url) {
        const audio = new Audio(track.preview_url);
        audio.play().catch(console.error);
      }
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useClickOutside(
    dropdownRef,
    () => {
      if (showDropdown) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    },
    showDropdown
  );

  const error = localError || spotifyError;

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1>Search Music</h1>

          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="search-form">
            <div className="search-input-group" ref={dropdownRef}>
              <SearchInput
                ref={inputRef}
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                onClear={handleClear}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                ariaExpanded={showDropdown}
                ariaControls="search-dropdown"
                ariaDescribedBy={error ? "search-error" : undefined}
                placeholder="Search for albums, artists, and tracks..."
              />

              <SearchDropdown
                suggestions={dropdownSuggestions}
                isVisible={showDropdown}
                selectedIndex={selectedIndex}
                onSuggestionSelect={handleSuggestionSelect}
                onHover={setSelectedIndex}
              />
            </div>
          </form>
        </div>

        {/* Results Section - Show albums, artists, and tracks */}
        {(albumResults.length > 0 || artistResults.length > 0 || trackResults.length > 0) && (
          <div className="unified-results">
            {albumResults.length > 0 && (
              <SearchResults
                results={albumResults}
                query={query}
                hasSearched={hasSearched}
                isLoading={loading}
                error={error}
              />
            )}

            {artistResults.length > 0 && (
              <ArtistSearchResults
                results={artistResults}
                query={query}
                hasSearched={hasSearched}
                isLoading={loading}
                error={error}
              />
            )}

            {trackResults.length > 0 && (
              <TrackSearchResults
                tracks={trackResults}
              />
            )}
          </div>
        )}

        {/* No results message */}
        {!loading && albumResults.length === 0 && artistResults.length === 0 && trackResults.length === 0 && hasSearched && (
          <div className="no-results">
            <p>No albums, artists, or tracks found for "{query}". Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};