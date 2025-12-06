import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Music, Star, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { backend } from '../services/backend';
import { logger } from '../utils/logger';
import type { AlbumReview } from '../types';
import '../styles/pages/Profile.css';

export const Profile: React.FC = () => {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayAsAnonymous, setDisplayAsAnonymous] = useState(false);
  const [updatingPreference, setUpdatingPreference] = useState(false);

  const { loginWithRedirect, user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const loadReviews = async () => {
      if (!isAuthenticated || !user?.sub) {
        setLoading(false);
        return;
      }

      try {
        logger.debug('[Profile] Fetching reviews for user:', user.sub);
        const data = await backend.getUserReviews(user.sub);
        const reviewsArray = Array.isArray(data) ? data : [];
        setReviews(reviewsArray);
        
        // Load user preferences
        try {
          const userPrefs = await backend.getUserPreferences(user.sub) as { displayAsAnonymous?: boolean };
          setDisplayAsAnonymous(userPrefs.displayAsAnonymous || false);
        } catch (err) {
          logger.error('Profile: Error loading user preferences:', err);
        }
      } catch (err) {
        logger.error('Profile: Error loading reviews:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      loadReviews();
    }
  }, [isAuthenticated, isLoading, user]);

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleToggleAnonymity = async () => {
    if (!user?.sub) return;
    
    setUpdatingPreference(true);
    const newValue = !displayAsAnonymous;
    
    try {
      await backend.updateUserPreferences(user.sub, { displayAsAnonymous: newValue });
      setDisplayAsAnonymous(newValue);
      logger.debug('[Profile] Updated anonymity preference to:', newValue);
    } catch (err: any) {
      logger.error('[Profile] Error updating anonymity preference:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Unknown error';
      alert(`Failed to update preference: ${errorMessage}. Please try again.`);
    } finally {
      setUpdatingPreference(false);
    }
  };

  if (isLoading || loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-content">
            <div className="login-prompt">
              <div className="login-hero">
                <div className="login-icon-stack">
                  <Music size={48} className="login-icon primary" />
                  <User size={32} className="login-icon secondary" />
                </div>
                <h1>Welcome to RecordCrate</h1>
                <p className="hero-subtitle">Your personal music collection and review platform</p>
              </div>
              
              <div className="login-features">
                <div className="feature-list">
                  <div className="feature-item">
                    <Star size={20} className="feature-icon" />
                    <span>Rate and review your favorite albums</span>
                  </div>
                  <div className="feature-item">
                    <Music size={20} className="feature-icon" />
                    <span>Discover new music from Spotify</span>
                  </div>
                  <div className="feature-item">
                    <User size={20} className="feature-icon" />
                    <span>Build your personal music profile</span>
                  </div>
                  <div className="feature-item">
                    <Calendar size={20} className="feature-icon" />
                    <span>Track your listening journey</span>
                  </div>
                </div>
              </div>

              <div className="login-action">
                <button className="auth-login-btn large primary" onClick={handleLogin}>
                  <User size={20} />
                  Sign In to RecordCrate
                </button>
                <p className="login-note">
                  Sign in to start building your music collection and reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // reviews[].overallRating is now stored as percent (0-100)
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length
    : 0;

  const percentColor = (p: number) => {
    const n = Number(p) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(n))) / 100;
    const hue = Math.round(pct * 120);
    return `hsl(${hue}, 100%, 45%)`;
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="user-profile">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name || user.email || 'User'}
                className="profile-avatar"
                loading="lazy"
              />
            )}
            <div className="user-details">
              <h1>{user?.name || user?.email || 'User'}</h1>
              {user?.email && (
                <p className="user-email">{user.email}</p>
              )}
              <div className="user-stats">
                <div className="stat">
                  <Music size={16} />
                  <span>{reviews.length} Reviews</span>
                </div>
                {reviews.length > 0 && (
                  <div className="stat">
                    <Star size={16} />
                    <span>Avg Rating: {averageRating.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="privacy-settings">
            <div className="privacy-toggle-card">
              <div className="privacy-toggle-info">
                <div className="privacy-toggle-icon">
                  {displayAsAnonymous ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
                <div className="privacy-toggle-text">
                  <h3>Display Preference</h3>
                  <p>{displayAsAnonymous ? 'Reviews shown as Anonymous' : 'Reviews shown with your name'}</p>
                </div>
              </div>
              <button
                className={`toggle-switch ${displayAsAnonymous ? 'active' : ''}`}
                onClick={handleToggleAnonymity}
                disabled={updatingPreference}
                aria-label={displayAsAnonymous ? 'Switch to show name' : 'Switch to anonymous'}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
            <p className="privacy-note">
              When enabled, your reviews will be displayed as "Anonymous" instead of your name. 
              This setting affects how others see your reviews across the platform.
            </p>
          </div>
        </div>

        <div className="profile-content">"
          <section className="reviews-section">
            <h2>Your Album Reviews</h2>
            {reviews.length === 0 ? (
              <div className="empty-reviews">
                <Music size={48} className="empty-icon" />
                <h3>No reviews yet</h3>
                <p>Start reviewing albums to build your music collection!</p>
                <Link to="/search" className="search-link">
                  Search for Albums
                </Link>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <Link to={`/album/${review.albumId}`} className="review-link">
                      <div className="review-album-art">
                        {review.album?.images?.[0] && (
                          <img
                            src={review.album.images[0].url}
                            alt={review.album.name}
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="review-details">
                        <h3 className="review-album-title">{review.album?.name}</h3>
                        <p className="review-album-artist">
                          {review.album?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                        </p>
                        <div className="review-rating">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="percent-badge">{review.overallRating}%</div>
                            <div style={{ width: 80, height: 8, background: 'color-mix(in srgb, var(--panel-bg) 14%, transparent)', borderRadius: 4, overflow: 'hidden' }}>
                              <div className="percent-fill" style={{ width: `${review.overallRating}%`, height: '100%', background: percentColor(review.overallRating) }} />
                            </div>
                          </div>
                        </div>
                        {review.writeup && (
                          <p className="review-excerpt">
                            {review.writeup.length > 100
                              ? `${review.writeup.substring(0, 100)}...`
                              : review.writeup
                            }
                          </p>
                        )}
                        <div className="review-date">
                          <Calendar size={14} />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Future: Spotify integration features could be added here */}
        </div>
      </div>
    </div>
  );
};

export default Profile;