import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Loader } from 'lucide-react';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { TrackSearchResults } from '../components/TrackSearchResults';
import { AlbumCardSkeleton } from '../components/AlbumCardSkeleton';
import { useSpotify } from '../hooks/useSpotify';
import type { SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '../types';

interface NaturalLanguageSearchResults {
  albums: SpotifyAlbum[];
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  query?: any;
  spotifyQuery?: string;
}

interface NaturalLanguageSearchProps {
  onClose?: () => void;
}

export const NaturalLanguageSearch: React.FC<NaturalLanguageSearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NaturalLanguageSearchResults>({ 
    albums: [], 
    artists: [], 
    tracks: [] 
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [searchDescription, setSearchDescription] = useState('');
  const [sageActive, setSageActive] = useState(false);
  const { loading, error, naturalLanguageSearch } = useSpotify();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Activate sage green transition
    setSageActive(true);
    
    setHasSearched(true);
    const searchResults = await naturalLanguageSearch(query);
    setResults(searchResults);
    setSearchDescription(searchResults.query?.description || query);
  }, [query, naturalLanguageSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults({ albums: [], artists: [], tracks: [] });
    setHasSearched(false);
    setSearchDescription('');
    inputRef.current?.focus();
  }, []);

  const totalResults = results.albums.length + results.artists.length + results.tracks.length;

  return (
    <div className={`natural-language-search${sageActive ? ' sage-active' : ''}`}>
      <div className="search-header">
        <div className="search-title-row">
          <div className="search-title">
            <Sparkles size={24} className="sparkles-icon" />
            <h1>Natural Language Search</h1>
          </div>
          {onClose && (
            <button onClick={onClose} className="close-button" aria-label="Close natural language search">
              <X size={20} />
            </button>
          )}
        </div>
        <p className="search-subtitle">
          Discover music through conversational queries — find albums, artists, and tracks using natural language descriptions
        </p>
        <div className="example-queries">
          <button 
            type="button"
            onClick={() => { setQuery('upbeat indie rock from the 2000s'); inputRef.current?.focus(); }}
            className="example-query"
          >
            "upbeat indie rock from the 2000s"
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('artists similar to Radiohead'); inputRef.current?.focus(); }}
            className="example-query"
          >
            "artists similar to Radiohead"
          </button>
          <button 
            type="button"
            onClick={() => { setQuery('melancholic R&B albums like Blonde'); inputRef.current?.focus(); }}
            className="example-query"
          >
            "melancholic R&B albums like Blonde"
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <div className="search-input-group natural-language">
              <Sparkles size={18} className="search-icon natural-language-icon" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: 'upbeat pop songs from the 2010s' or 'artists similar to Taylor Swift'"
                className="search-input natural-language-input"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="clear-button"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button 
                type="submit" 
                className="search-button natural-language-button"
                disabled={!query.trim() || loading}
              >
                {loading ? <Loader size={16} className="spinning" /> : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ARIA live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {loading && 'Searching for music...'}
        {!loading && hasSearched && totalResults > 0 && `Found ${totalResults} results`}
        {!loading && hasSearched && totalResults === 0 && 'No results found'}
        {error && `Error: ${error}`}
      </div>

      {error && (
        <div className="error-message" role="alert">
          <p>Error: {error}</p>
        </div>
      )}

      {loading && hasSearched && (
        <div className="search-results-section">
          <div className="results-summary skeleton-summary">
            <div className="skeleton-text skeleton-count skeleton-shimmer"></div>
          </div>
          <div className="results-section">
            <div className="section-header">
              <div className="skeleton-text skeleton-section-title skeleton-shimmer"></div>
            </div>
            <div className="album-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <AlbumCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="search-results-section" role="region" aria-label="Search results">
          {searchDescription && (
            <div className="search-interpretation" role="region" aria-label="AI query interpretation">
              <div className="interpretation-header">
                <Sparkles size={16} />
                <span>Query Analysis</span>
              </div>
              <div className="interpretation-content">
                <p className="interpretation-text">{searchDescription}</p>
                {results.spotifyQuery && results.spotifyQuery !== query && (
                  <p className="spotify-query"><code>{results.spotifyQuery}</code></p>
                )}
              </div>
            </div>
          )}

          {totalResults === 0 ? (
            <div className="no-results">
              <div className="no-results-icon-wrapper">
                <Sparkles size={56} className="no-results-icon" />
              </div>
              <h3>No Matches Found</h3>
              <p>Refine your query with different keywords, genres, or time periods to discover relevant music.</p>
              <div className="search-tips">
                <h4>Search Tips:</h4>
                <ul>
                  <li>Include specific genres, moods, or time periods</li>
                  <li>Reference similar artists or albums</li>
                  <li>Use descriptive terms like "upbeat," "melancholic," or "experimental"</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="results-summary">
              <span className="total-count">{totalResults} Total Results</span>
              <div className="results-breakdown">
                {results.albums.length > 0 && <span className="breakdown-item">{results.albums.length} Albums</span>}
                {results.artists.length > 0 && <span className="breakdown-item">{results.artists.length} Artists</span>}
                {results.tracks.length > 0 && <span className="breakdown-item">{results.tracks.length} Tracks</span>}
              </div>
            </div>
          )}

          {results.albums.length > 0 && (
            <div className="results-section albums-section" role="region" aria-labelledby="albums-heading">
              <div className="section-header">
                <h3 id="albums-heading">Albums ({results.albums.length})</h3>
              </div>
              <div className="album-grid">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {results.artists.length > 0 && (
            <div className="results-section artists-section" role="region" aria-labelledby="artists-heading">
              <div className="section-header">
                <h3 id="artists-heading">Artists ({results.artists.length})</h3>
              </div>
              <div className="artist-grid">
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </div>
          )}

          {results.tracks.length > 0 && (
            <div className="results-section tracks-section" role="region" aria-labelledby="tracks-heading">
              <div className="section-header">
                <h3 id="tracks-heading">Tracks ({results.tracks.length})</h3>
              </div>
              <TrackSearchResults tracks={results.tracks} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};