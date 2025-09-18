import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { AlbumCard } from '../components/AlbumCard';
import { useSpotify } from '../hooks/useSpotify';
import type { SpotifyAlbum } from '../types';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const { loading, error, searchAlbums } = useSpotify();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const albums = await searchAlbums(query);
    setResults(albums);
  };

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1>Search Albums</h1>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <SearchIcon size={20} className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for albums, artists..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>
        </div>

        {loading && <div className="loading">Searching...</div>}
        {error && <div className="error">Error: {error}</div>}

        {results.length > 0 && (
          <div className="search-results">
            <h2>Results ({results.length})</h2>
            <div className="album-grid">
              {results.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => console.log('Navigate to album:', album.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};