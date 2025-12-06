import React, { useState, useRef } from 'react';
import { Sparkles, X, Loader } from 'lucide-react';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { TrackSearchResults } from '../components/TrackSearchResults';
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
  const { loading, error, naturalLanguageSearch } = useSpotify();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    const searchResults = await naturalLanguageSearch(query);
    setResults(searchResults);
    setSearchDescription(searchResults.query?.description || query);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ albums: [], artists: [], tracks: [] });
    setHasSearched(false);
    setSearchDescription('');
    inputRef.current?.focus();
  };

  const totalResults = results.albums.length + results.artists.length + results.tracks.length;

  return (
    <div className="natural-language-search">
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
          <div className="example-query">"upbeat indie rock from the 2000s"</div>
          <div className="example-query">"artists similar to Radiohead"</div>
          <div className="example-query">"melancholic R&B albums like Blonde"</div>
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

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="search-results-section">
          {searchDescription && (
            <div className="search-interpretation">
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
              <div className="results-count">
                <span className="count-number">{totalResults}</span>
                <span className="count-label">Results Found</span>
              </div>
              <div className="results-breakdown">
                {results.albums.length > 0 && <span className="breakdown-item">{results.albums.length} Albums</span>}
                {results.artists.length > 0 && <span className="breakdown-item">{results.artists.length} Artists</span>}
                {results.tracks.length > 0 && <span className="breakdown-item">{results.tracks.length} Tracks</span>}
              </div>
            </div>
          )}

          {results.albums.length > 0 && (
            <div className="results-section albums-section">
              <div className="section-header">
                <h3>Albums</h3>
                <span className="section-count">{results.albums.length}</span>
              </div>
              <div className="album-grid">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {results.artists.length > 0 && (
            <div className="results-section artists-section">
              <div className="section-header">
                <h3>Artists</h3>
                <span className="section-count">{results.artists.length}</span>
              </div>
              <div className="artist-grid">
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </div>
          )}

          {results.tracks.length > 0 && (
            <div className="results-section tracks-section">
              <div className="section-header">
                <h3>Tracks</h3>
                <span className="section-count">{results.tracks.length}</span>
              </div>
              <TrackSearchResults tracks={results.tracks} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};