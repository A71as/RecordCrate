import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Music, Star, Calendar } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import type { SpotifyUser, AlbumReview } from '../types';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setIsLoggedIn(spotifyService.isLoggedIn());
      
      if (spotifyService.isLoggedIn()) {
        const currentUser = await spotifyService.getCurrentUser();
        setUser(currentUser);
      }

      // Load reviews from localStorage
      const savedReviewsRaw = JSON.parse(localStorage.getItem('albumReviews') || '[]');
      // migrate any 0-5 overallRating to 0-100 percent
      const savedReviewsArr = savedReviewsRaw as AlbumReview[];
      const migrated: AlbumReview[] = (savedReviewsArr || []).map((r) => {
        if (typeof r.overallRating === 'number' && r.overallRating <= 5) {
          return { ...r, overallRating: Math.round(r.overallRating * 20) };
        }
        return { ...r, overallRating: Math.round(r.overallRating || 0) };
      });
      setReviews(migrated);
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleLogin = () => {
    window.location.href = spotifyService.getAuthUrl();
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  if (!isLoggedIn) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-content">
            <div className="login-prompt">
              <User size={64} className="login-icon" />
              <h1>Connect Your Spotify Account</h1>
              <p>Sign in with Spotify to access personalized features and sync your music preferences.</p>
              <button className="spotify-login-btn large" onClick={handleLogin}>
                <Music size={20} />
                Login with Spotify
              </button>
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
          {user && (
            <div className="user-profile">
              {user.images && user.images[0] && (
                <img 
                  src={user.images[0].url} 
                  alt={user.display_name}
                  className="profile-avatar" 
                />
              )}
              <div className="user-details">
                <h1>{user.display_name}</h1>
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
                  <div className="stat">
                    <User size={16} />
                    <span>{user.followers.total} Followers</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <div className="percent-badge">{review.overallRating}%</div>
                            <div style={{width: 80, height: 8, background: '#eee', borderRadius: 4, overflow:'hidden'}}>
                              <div className="percent-fill" style={{width: `${review.overallRating}%`, height: '100%', background: percentColor(review.overallRating)}}/>
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
        </div>
      </div>
    </div>
  );
};