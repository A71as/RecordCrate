import React, { useState, useEffect } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { FilterTabs } from '../components/FilterTabs';
import { useSpotify } from '../hooks/useSpotify';
import type { SpotifyAlbum, SpotifyArtist, FilterType } from '../types';

export const Home: React.FC = () => {
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('new-releases-week');
  const { loading, error, getFilteredContent } = useSpotify();

  useEffect(() => {
    const fetchContent = async () => {
      const { albums: fetchedAlbums, artists: fetchedArtists } = 
        await getFilteredContent(activeFilter);
      setAlbums(fetchedAlbums);
      setArtists(fetchedArtists || []);
    };

    fetchContent();
  }, [activeFilter]);

  const getContentTitle = () => {
    switch (activeFilter) {
      case 'new-releases-week':
        return 'New Releases This Week';
      case 'new-releases-month':
        return 'New Releases This Month';
      case 'new-releases-year':
        return 'New Releases This Year';
      case 'popular-week':
        return 'Most Popular This Week';
      case 'popular-month':
        return 'Most Popular This Month';
      case 'popular-year':
        return 'Most Popular This Year';
      case 'personal-week':
        return 'Your Top Music This Week';
      case 'personal-6months':
        return 'Your Top Music (6 Months)';
      case 'personal-alltime':
        return 'Your All-Time Favorites';
      default:
        return 'Featured Albums';
    }
  };

  const showPersonalNote = activeFilter.startsWith('personal');

  if (loading) return <div className="loading">Loading content...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1>Welcome to AlbumBoxd</h1>
          <p>Discover, review, and catalog your favorite albums</p>
        </section>

        <section className="content-filters">
          <FilterTabs 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter} 
          />
        </section>

        {showPersonalNote && (
          <div className="personal-note">
            <p>
              <strong>Note:</strong> Personal listening data requires Spotify account 
              connection. Currently showing popular content as placeholder.
            </p>
          </div>
        )}

        <section className="filtered-content">
          <h2>{getContentTitle()}</h2>
          
          {albums.length > 0 && (
            <div className="content-section">
              <h3>Albums</h3>
              <div className="album-grid">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onClick={() => console.log('Navigate to album:', album.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {artists.length > 0 && (
            <div className="content-section">
              <h3>Artists</h3>
              <div className="artist-grid">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onClick={() => console.log('Navigate to artist:', artist.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};