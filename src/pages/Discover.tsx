import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { logger } from '../utils/logger';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { FilterTabs } from '../components/FilterTabs';
import { AlbumGridSkeleton } from '../components/AlbumCardSkeleton';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AlbumStreakCalendar, { type AlbumStreakCalendarEntry } from '../components/AlbumStreakCalendar';
import { useSpotify } from '../hooks/useSpotify';
import { spotifyService } from '../services/spotify';
import { backend } from '../services/backend';
import { recommendationService } from '../services/recommendations';
import { dailyRecommendationService, type DailyRecommendation } from '../services/dailyRecommendation';
import type { SpotifyAlbum, SpotifyArtist, FilterType } from '../types';
import type { RecommendationScore } from '../services/recommendations';
import '../styles/pages/Discover.css';

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('new-releases-week');
  const [retryCount, setRetryCount] = useState(0);
  const [albumPage, setAlbumPage] = useState(1);
  const [displayedAlbums, setDisplayedAlbums] = useState<SpotifyAlbum[]>([]);
  const [recommendations, setRecommendations] = useState<{
    albums: RecommendationScore[];
    artists: RecommendationScore[];
  }>({ albums: [], artists: [] });
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [dailyAlbum, setDailyAlbum] = useState<SpotifyAlbum | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [hasReviewedToday, setHasReviewedToday] = useState(false);
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

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const result = await getFilteredContent(activeFilter);
        // Extra defensive checks to ensure we always have arrays
        const fetchedAlbums = Array.isArray(result?.albums) ? result.albums : [];
        const fetchedArtists = Array.isArray(result?.artists) ? result.artists : [];
        setAlbums(fetchedAlbums);
        setArtists(fetchedArtists);
        setAlbumPage(1);
      } catch (err) {
        logger.error('Failed to fetch filtered content:', err);
        setAlbums([]);
        setArtists([]);
      }
    };

    fetchContent();
  }, [activeFilter, retryCount]); // Removed getFilteredContent from dependencies

  // Load personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Fetch user reviews first
        let userReviews = [];
        if (isAuthenticated && user?.sub) {
          try {
            const reviewsData = await backend.getUserReviews(user.sub);
            userReviews = Array.isArray(reviewsData) ? reviewsData : [];
          } catch (err) {
            logger.error('Failed to load user reviews for recommendations:', err);
          }
        }
        
        const recs = await recommendationService.getPersonalizedFeed(userReviews, 20);
        setRecommendations(recs);
      } catch (err) {
        logger.error('Failed to load recommendations:', err);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated, user]); // Re-fetch when auth state changes

  // Load daily AI recommendation
  useEffect(() => {
    const fetchDailyRecommendation = async () => {
      if (!isAuthenticated || !user?.sub) return;
      
      setLoadingDaily(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if already reviewed today
        const reviewed = dailyRecommendationService.hasReviewedForDate(today);
        setHasReviewedToday(reviewed);
        
        const recommendation = await dailyRecommendationService.getTodayRecommendation(user.sub);
        if (recommendation) {
          setDailyRecommendation(recommendation);
          
          // Search for the album on Spotify
          const results = await spotifyService.searchAlbums(recommendation.album.searchQuery);
          if (results.length > 0) {
            const foundAlbum = results[0];
            setDailyAlbum(foundAlbum);
            
            // Update the cached recommendation with the Spotify album ID
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
  
  // Show error message but don't prevent page from rendering
  const hasError = error !== null;

  return (
    <div className="discover">
      <div className="container">
        {hasError && (
          <div className="error-banner" style={{ 
            background: 'var(--rc-red-light)', 
            border: '2px solid var(--rc-red)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--rc-red)', fontSize: '1.1rem', fontWeight: '600' }}>
              ⚠️ Unable to load Spotify content
            </p>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.95rem' }}>
              {error}
            </p>
            <button 
              onClick={handleRetry}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.5rem' }}
            >
              🔄 Retry
            </button>
          </div>
        )}
        
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
                  <div className="aotd-album" onClick={() => navigate(`/album/${dailyAlbum.id}`)}>
                    <img 
                      src={dailyAlbum.images?.[0]?.url || '/placeholder-album.png'} 
                      alt={dailyAlbum.name}
                      className="aotd-cover"
                    />
                  </div>
                  <div className="aotd-info">
                    <h3>{dailyAlbum.name}</h3>
                    <p className="aotd-artist">{dailyAlbum.artists?.[0]?.name || 'Unknown Artist'}</p>
                    <p className="aotd-reason">{dailyRecommendation.reason}</p>
                    {hasReviewedToday ? (
                      <p className="aotd-cta reviewed">
                        ✅ Great job! You've already reviewed today's album!
                      </p>
                    ) : (
                      <p className="aotd-cta">
                        Review this album today to keep your streak going! 🔥
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aotd-error" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--muted)' }}>
                    Could not load today's recommendation.
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-secondary btn-sm"
                  >
                    🔄 Retry
                  </button>
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
        {Array.isArray(recommendations?.albums) && recommendations.albums.length > 0 && (
          <section className="recommendations-section">
            <div className="section-header">
              <h2>Recommended For You</h2>
              <p className="section-description">
                Based on your listening history and ratings
              </p>
            </div>
            
            <div className="content-section">
              <h3>✨ Albums You Might Like</h3>
              <div className="album-grid">
                {recommendations.albums.slice(0, 10).map((rec) => (
                  rec?.item?.id ? (
                    <div key={rec.item.id} className="recommendation-item">
                      <AlbumCard
                        album={rec.item as SpotifyAlbum}
                      />
                      <p className="recommendation-reason">{rec.reason}</p>
                    </div>
                  ) : null
                ))}
              </div>
            </div>

            {Array.isArray(recommendations?.artists) && recommendations.artists.length > 0 && (
              <div className="content-section">
                <h3>Artists to Explore</h3>
                <div className="artist-grid">
                  {recommendations.artists.slice(0, 6).map((rec) => (
                    rec?.item?.id ? (
                      <div key={rec.item.id} className="recommendation-item">
                        <ArtistCard
                          artist={rec.item as SpotifyArtist}
                          onClick={() => navigate(`/artist/${rec.item.id}`)}
                        />
                        <p className="recommendation-reason">{rec.reason}</p>
                      </div>
                    ) : null
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
          
          {Array.isArray(albums) && albums.length > 0 && (
            <div className="content-section">
              <h3>Albums</h3>
              <div className="album-grid">
                {Array.isArray(displayedAlbums) && displayedAlbums.map((album) => (
                  album && album.id ? (
                    <AlbumCard
                      key={album.id}
                      album={album}
                    />
                  ) : null
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

          {Array.isArray(artists) && artists.length > 0 && (
            <div className="content-section">
              <h3>Artists</h3>
              <div className="artist-grid">
                {Array.isArray(artists) && artists.map((artist) => (
                  artist && artist.id ? (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onClick={() => navigate(`/artist/${artist.id}`)}
                    />
                  ) : null
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Wrap with error boundary to prevent page crashes
export const Discover: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Discover Music</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            We're having trouble loading content right now. Please try again in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--rc-primary)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <DiscoverPage />
    </ErrorBoundary>
  );
};

export default Discover;
