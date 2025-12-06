import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { FilterTabs } from '../components/FilterTabs';
import { AlbumGridSkeleton } from '../components/AlbumCardSkeleton';
import AlbumStreakCalendar, { type AlbumStreakCalendarEntry } from '../components/AlbumStreakCalendar';
import { useSpotify } from '../hooks/useSpotify';
import { spotifyService } from '../services/spotify';
import { recommendationService } from '../services/recommendations';
import { dailyRecommendationService, type DailyRecommendation } from '../services/dailyRecommendation';
import type { SpotifyAlbum, SpotifyArtist, FilterType } from '../types';
import type { RecommendationScore } from '../services/recommendations';
import '../styles/pages/Discover.css';

export const Discover: React.FC = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('new-releases-week');
  const [albumPage, setAlbumPage] = useState(1);
  const [displayedAlbums, setDisplayedAlbums] = useState<SpotifyAlbum[]>([]);
  const [recommendations, setRecommendations] = useState<{
    albums: RecommendationScore[];
    artists: RecommendationScore[];
  }>({ albums: [], artists: [] });
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [dailyAlbum, setDailyAlbum] = useState<SpotifyAlbum | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const ALBUMS_PER_PAGE = 10;
  const { loading, error, getFilteredContent } = useSpotify();
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const [calendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dailyEntries, setDailyEntries] = useState<AlbumStreakCalendarEntry[]>([]);
  const canTrackStreak = isAuthenticated;

  const loadStreakCalendar = useCallback(() => {
    const entries = dailyRecommendationService.getCalendarEntries(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth()
    );
    setDailyEntries(entries);
  }, [calendarMonth]);

  useEffect(() => {
    const fetchContent = async () => {
      const { albums: fetchedAlbums, artists: fetchedArtists} = 
        await getFilteredContent(activeFilter);
      setAlbums(fetchedAlbums);
      setArtists(fetchedArtists || []);
      setAlbumPage(1);
    };

    fetchContent();
  }, [activeFilter, getFilteredContent]);

  // Load personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const recs = await recommendationService.getPersonalizedFeed(20);
        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      }
    };

    fetchRecommendations();
  }, []); // Load once on mount

  // Load daily AI recommendation
  useEffect(() => {
    const fetchDailyRecommendation = async () => {
      if (!isAuthenticated || !user?.sub) return;
      
      setLoadingDaily(true);
      try {
        const recommendation = await dailyRecommendationService.getTodayRecommendation(user.sub);
        if (recommendation) {
          setDailyRecommendation(recommendation);
          
          // Search for the album on Spotify
          const results = await spotifyService.searchAlbums(recommendation.album.searchQuery);
          if (results.length > 0) {
            const foundAlbum = results[0];
            setDailyAlbum(foundAlbum);
            
            // Update the cached recommendation with the Spotify album ID
            const today = new Date().toISOString().split('T')[0];
            dailyRecommendationService.updateAlbumId(today, foundAlbum.id);
          }
        }
      } catch (err) {
        console.error('Failed to load daily recommendation:', err);
      } finally {
        setLoadingDaily(false);
      }
    };

    fetchDailyRecommendation();
  }, [isAuthenticated, user]);

  // Update displayed albums when albums or page changes
  useEffect(() => {
    const endIndex = albumPage * ALBUMS_PER_PAGE;
    const sliced = albums.slice(0, endIndex);
    setDisplayedAlbums(sliced);
  }, [albums, albumPage]);

  const handleLoadMore = () => {
    setAlbumPage(prev => prev + 1);
  };

  const hasMoreAlbums = displayedAlbums.length < albums.length;

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

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Show skeleton loading state instead of plain text
  if (loading) {
    return (
      <div className="discover">
        <div className="container">
          <section className="hero">
            <h1>Discover Music</h1>
            <p>Explore new releases, popular albums, and personalized recommendations</p>
          </section>
          <section className="filtered-content">
            <h2>Loading...</h2>
            <div className="content-section">
              <AlbumGridSkeleton count={10} />
            </div>
          </section>
        </div>
      </div>
    );
  }
  
  // Only show detailed error in development - in production just continue to show the page
  if (error && import.meta.env.MODE === 'development') {
    return (
      <div className="error" style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--rc-red)' }}>⚠️ Spotify API Setup Required</h3>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
          To view music content on this page, you need to set up Spotify API credentials.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Check the .env.example file for setup instructions.
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
          {/* Album of the Day - AI Recommendation */}
          {isAuthenticated && (
            <div className="album-of-the-day">
              <div className="aotd-header">
                <h2>🎵 Album of the Day</h2>
                <p className="aotd-subtitle">Your personalized AI pick for today</p>
              </div>
              
              {loadingDaily ? (
                <div className="aotd-loading">
                  <p>Loading today's recommendation...</p>
                </div>
              ) : dailyAlbum && dailyRecommendation ? (
                <div className="aotd-content">
                  <div className="aotd-album">
                    <AlbumCard album={dailyAlbum} />
                  </div>
                  <div className="aotd-info">
                    <h3>{dailyAlbum.name}</h3>
                    <p className="aotd-artist">{dailyAlbum.artists[0]?.name}</p>
                    <p className="aotd-reason">{dailyRecommendation.reason}</p>
                    <p className="aotd-cta">
                      Review this album today to keep your streak going! 🔥
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aotd-error">
                  <p>Could not load today's recommendation. Please try refreshing the page.</p>
                </div>
              )}
            </div>
          )}

          <div className={`calendar-lock-wrapper ${!canTrackStreak ? 'locked' : ''}`}>
            <AlbumStreakCalendar
              month={calendarMonth}
              entries={dailyEntries}
              description="Review today's AI-recommended album to turn the date green. Miss a day and it stays gray."
            />
            {!canTrackStreak && (
              <div className="calendar-lock-overlay">
                <p>Log in to unlock your AI recommendation streak tracker.</p>
                <button
                  type="button"
                  className="spotify-login-btn large"
                  onClick={() => loginWithRedirect()}
                >
                  Login
                </button>
              </div>
            )}
          </div>
          {!canTrackStreak && (
            <p className="streak-login-note">
              To track your rating streak for the daily AI recommendation, please log in.
            </p>
          )}
        </section>

        {/* Personalized Recommendations Section */}
        {recommendations.albums.length > 0 && (
          <section className="recommendations-section">
            <div className="section-header">
              <h2>Recommended For You</h2>
              <p className="section-description">
                Based on your listening history and ratings
              </p>
            </div>
            
            <div className="content-section">
              <h3>Albums You Might Like</h3>
              <div className="album-grid">
                {recommendations.albums.slice(0, 10).map((rec) => (
                  <div key={rec.item.id} className="recommendation-item">
                    <AlbumCard
                      album={rec.item as SpotifyAlbum}
                    />
                    <p className="recommendation-reason">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {recommendations.artists.length > 0 && (
              <div className="content-section">
                <h3>Artists to Explore</h3>
                <div className="artist-grid">
                  {recommendations.artists.slice(0, 6).map((rec) => (
                    <div key={rec.item.id} className="recommendation-item">
                      <ArtistCard
                        artist={rec.item as SpotifyArtist}
                        onClick={() => navigate(`/artist/${rec.item.id}`)}
                      />
                      <p className="recommendation-reason">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="content-filters">
          <FilterTabs 
            activeFilter={activeFilter} 
            onFilterChange={handleFilterChange} 
          />
        </section>

        {showPersonalNote && (
          <div className="personal-note">
            <p>
              <strong>Note:</strong> Personal listening data requires login. 
              Currently showing popular content from the Spotify catalog.
            </p>
          </div>
        )}

        <section className="filtered-content">
          <h2>{getContentTitle()}</h2>
          
          {albums.length > 0 && (
            <div className="content-section">
              <h3>Albums</h3>
              <div className="album-grid">
                {displayedAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                  />
                ))}
              </div>
              {hasMoreAlbums && (
                <button 
                  className="load-more-button"
                  onClick={handleLoadMore}
                >
                  Load More Albums
                </button>
              )}
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
                    onClick={() => navigate(`/artist/${artist.id}`)}
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
