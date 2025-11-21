import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Music, Star, Calendar } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import type { AlbumReview } from '../types';

export const Profile: React.FC = () => {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);

  const { loginWithRedirect, user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const loadReviews = () => {
      const savedReviewsRaw = localStorage.getItem('albumReviews') || '[]';
      try {
        const savedReviewsArr = JSON.parse(savedReviewsRaw) as AlbumReview[];
        const migrated: AlbumReview[] = (savedReviewsArr || []).map((r) => {
          if (typeof r.overallRating === 'number' && r.overallRating <= 5) {
            return { ...r, overallRating: Math.round(r.overallRating * 20) };
          }
          return { ...r, overallRating: Math.round(r.overallRating || 0) };
        });
        setReviews(migrated);
      } catch (err) {
        console.error('Profile: Error parsing reviews:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const handleLogin = () => {
    loginWithRedirect();
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
        </div>

        <div className="profile-content">
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
                          />
                        )}
                      </div>
                      <div className="review-details">
                        <h3 className="review-album-title">{review.album?.name}</h3>
                        <p className="review-album-artist">
                          {review.album?.artists.map(a => a.name).join(', ')}
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