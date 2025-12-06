import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Music, Star, Calendar } from 'lucide-react';
import { backend } from '../services/backend';
import type { AlbumReview } from '../types';
import '../styles/pages/UserProfile.css';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserReviews();
    }
  }, [userId]);

  const loadUserReviews = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[UserProfile] Fetching reviews for user:', userId);
      const data = await backend.getUserReviews(userId);
      console.log('[UserProfile] Reviews loaded:', data);
      
      const reviewsArray = Array.isArray(data) ? data : [];
      setReviews(reviewsArray);
      
      // Extract user info from first review
      if (reviewsArray.length > 0 && reviewsArray[0].user) {
        setUserName(reviewsArray[0].user.displayName || 'User');
        setUserAvatar(reviewsArray[0].user.avatarUrl || null);
      }
    } catch (err) {
      console.error('[UserProfile] Failed to load reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load user profile: ${errorMessage}`);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const percentColor = (p: number) => {
    const n = Number(p) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(n))) / 100;
    const hue = Math.round(pct * 120);
    return `hsl(${hue}, 100%, 45%)`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading user profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="container">
          <div className="error-message">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="container">
        <div className="user-profile-header">
          <div className="user-info">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="user-avatar"
                loading="lazy"
              />
            ) : (
              <div className="user-avatar-placeholder">
                <User size={48} />
              </div>
            )}
            <div className="user-details">
              <h1>{userName}</h1>
              <div className="user-stats">
                <div className="stat">
                  <Music size={16} />
                  <span>{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</span>
                </div>
                {reviews.length > 0 && (
                  <div className="stat">
                    <Star size={16} />
                    <span>Avg: {averageRating.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="user-reviews-section">
          <h2>{userName}'s Reviews</h2>
          {reviews.length === 0 ? (
            <div className="no-reviews">
              <Music size={48} />
              <p>This user hasn't reviewed any albums yet.</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => {
                const albumName = review.albumName || review.album?.name || 'Unknown Album';
                const albumArtists = Array.isArray(review.albumArtists) && review.albumArtists.length > 0
                  ? review.albumArtists.join(', ')
                  : review.album?.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
                const albumImage = review.albumImage || review.album?.images?.[0]?.url || null;

                return (
                  <div key={review.id || review._id || `${review.userId}-${review.albumId}`} className="review-card">
                    <Link to={`/album/${review.albumId}`} className="review-album-link">
                      {albumImage ? (
                        <img
                          src={albumImage}
                          alt={albumName}
                          className="review-album-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="review-album-placeholder">
                          <Music size={32} />
                        </div>
                      )}
                      <div className="review-album-info">
                        <h3>{albumName}</h3>
                        <p className="review-artists">{albumArtists}</p>
                      </div>
                    </Link>

                    <div className="review-rating-section">
                      <div className="review-rating-display">
                        <div className="percent-badge large">{Math.round(review.overallRating)}%</div>
                        <div className="percent-bar">
                          <div
                            className="percent-fill"
                            style={{
                              width: `${review.overallRating}%`,
                              background: percentColor(review.overallRating)
                            }}
                          />
                        </div>
                      </div>

                      {review.scoreModifiers && Object.values(review.scoreModifiers).some(v => v !== 0) && (
                        <div className="review-modifiers-badge">
                          <span className="modifiers-label">Score modifiers applied</span>
                        </div>
                      )}
                    </div>

                    {review.writeup && (
                      <div className="review-writeup-preview">
                        <p>
                          {review.writeup.length > 200
                            ? `${review.writeup.substring(0, 200)}...`
                            : review.writeup}
                        </p>
                      </div>
                    )}

                    <div className="review-meta">
                      <div className="review-date">
                        <Calendar size={16} />
                        <span>{formatDate(review.createdAt || review.updatedAt || new Date().toISOString())}</span>
                      </div>
                    </div>

                    <Link to={`/album/${review.albumId}`} className="view-album-btn">
                      View Album
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
