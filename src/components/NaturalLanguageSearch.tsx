import React, { useState, useRef } from 'react';
import { Search as SearchIcon, Sparkles, X, Loader } from 'lucide-react';
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
          Search using natural language like "albums like Blonde by Frank Ocean" or "sad indie music from the 2010s"
        </p>
        
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
              <p><strong>Interpreted as:</strong> {searchDescription}</p>
              {results.spotifyQuery && results.spotifyQuery !== query && (
                <p className="spotify-query"><strong>Spotify Query:</strong> {results.spotifyQuery}</p>
              )}
            </div>
          )}

          {totalResults === 0 ? (
            <div className="no-results">
              <Sparkles size={48} className="no-results-icon" />
              <h3>No results found</h3>
              <p>Try rephrasing your search or being more specific about what you're looking for.</p>
            </div>
          ) : (
            <div className="results-summary">
              <h2>Found {totalResults} results</h2>
            </div>
          )}

          {results.albums.length > 0 && (
            <div className="results-section">
              <h3>Albums ({results.albums.length})</h3>
              <div className="album-grid">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {results.artists.length > 0 && (
            <div className="results-section">
              <h3>Artists ({results.artists.length})</h3>
              <div className="artist-grid">
                {results.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </div>
          )}

          {results.tracks.length > 0 && (
            <div className="results-section">
              <h3>Tracks ({results.tracks.length})</h3>
              <TrackSearchResults 
                tracks={results.tracks} 
                onTrackSelect={(track) => {
                  if (track.preview_url) {
                    const audio = new Audio(track.preview_url);
                    audio.play().catch(console.error);
                  }
                }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};