import React, { useState, useEffect, useCallback } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { FilterTabs } from '../components/FilterTabs';
import AlbumStreakCalendar, { type AlbumStreakCalendarEntry } from '../components/AlbumStreakCalendar';
import { useSpotify } from '../hooks/useSpotify';
import { useAuth } from '../context/useAuth';
import type { SpotifyAlbum, SpotifyArtist, FilterType, AlbumReview } from '../types';

export const Discover: React.FC = () => {
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('new-releases-week');
  const { loading, error, getFilteredContent } = useSpotify();
  const {
    isSpotifyLinked,
    linkSpotifyAccount,
    loadingSpotify,
  } = useAuth();
  const [calendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dailyEntries, setDailyEntries] = useState<AlbumStreakCalendarEntry[]>([]);
  const canTrackStreak = isSpotifyLinked;

  const loadStreakCalendar = useCallback(() => {
    const now = calendarMonth;
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let aiLog: Record<string, unknown>;
    try {
      aiLog = JSON.parse(localStorage.getItem('aiDailyAlbumLog') ?? '{}') as Record<string, unknown>;
    } catch {
      aiLog = {};
    }

    let storedReviews: AlbumReview[];
    try {
      storedReviews = JSON.parse(localStorage.getItem('albumReviews') ?? '[]') as AlbumReview[];
    } catch {
      storedReviews = [];
    }

    const reviewDates = new Set(
      storedReviews
        .map((review) => review.createdAt?.split('T')[0])
        .filter((date): date is string => Boolean(date) && date.startsWith(monthPrefix))
    );

    const logDates = Object.keys(aiLog).filter((date) => date.startsWith(monthPrefix));
    const nextEntries: AlbumStreakCalendarEntry[] = [];

    logDates.forEach((date) => {
      const rated = reviewDates.has(date);
      nextEntries.push({
        date,
        status: rated ? 'completed' : 'pending',
      });
      if (rated) {
        reviewDates.delete(date);
      }
    });

    reviewDates.forEach((date) => {
      nextEntries.push({
        date,
        status: 'completed',
      });
    });

    if (nextEntries.length === 0) {
      nextEntries.push({
        date: `${monthPrefix}-${String(new Date().getDate()).padStart(2, '0')}`,
        status: 'pending',
      });
    }

    setDailyEntries(nextEntries);
  }, [calendarMonth]);

  useEffect(() => {
    const fetchContent = async () => {
      const { albums: fetchedAlbums, artists: fetchedArtists } = 
        await getFilteredContent(activeFilter);
      setAlbums(fetchedAlbums);
      setArtists(fetchedArtists || []);
    };

    fetchContent();
  }, [activeFilter, getFilteredContent]);

  useEffect(() => {
    loadStreakCalendar();
  }, [loadStreakCalendar]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'aiDailyAlbumLog' || event.key === 'albumReviews') {
        loadStreakCalendar();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadStreakCalendar]);

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
  if (error) {
    return (
      <div className="error" style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--rc-red)' }}>⚠️ Spotify API Setup Required</h3>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
          To view music content on this page, you need to set up Spotify API credentials. Don't worry, it's free and only takes a few minutes!
        </p>
        <div style={{ background: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--rc-amber-glow)' }}>Quick Setup Steps:</h4>
          <ol style={{ textAlign: 'left', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rc-amber-glow)', textDecoration: 'underline' }}>Spotify Developer Dashboard</a></li>
            <li>Click "Create app" and fill in any name (e.g., "RecordCrate Dev")</li>
            <li>Set Redirect URI to: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px', color: 'var(--rc-amber-glow)' }}>http://127.0.0.1:5173/callback</code></li>
            <li>Check "Web API" and save</li>
            <li>Click "Settings" and copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            <li>Open the <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>.env</code> file in your project root</li>
            <li>Replace <code>your_client_id_here</code> and <code>your_client_secret_here</code> with your actual values</li>
            <li>Restart the dev server: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>npm run dev</code></li>
          </ol>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '1rem' }}>
          💡 <strong>Tip:</strong> The Spotify API is completely free for development use and doesn't require any payment information.
        </p>
      </div>
    );
  }

  return (
    <div className="discover">
      <div className="container">
        <section className="hero">
          <h1>Discover Music</h1>
          <p>Explore new releases, popular albums, and personalized recommendations</p>
        </section>

        <section className="streak-calendar-section">
          <div className={`calendar-lock-wrapper ${!canTrackStreak ? 'locked' : ''}`}>
            <AlbumStreakCalendar
              month={calendarMonth}
              entries={dailyEntries}
              description="Log a rating for each AI pick to keep the streak alive. We'll fill in the green tiles once your teammates wire in the daily recommendations."
            />
            {!canTrackStreak && (
              <div className="calendar-lock-overlay">
                <p>Log in with Spotify to unlock your AI recommendation streak tracker.</p>
                <button
                  type="button"
                  className="spotify-login-btn large"
                  onClick={linkSpotifyAccount}
                  disabled={loadingSpotify}
                >
                  {loadingSpotify ? 'Opening Spotify…' : 'Login with Spotify'}
                </button>
              </div>
            )}
          </div>
          {!canTrackStreak && (
            <p className="streak-login-note">
              To track your rating streak for the daily AI recommendation, connect your Spotify account.
            </p>
          )}
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
