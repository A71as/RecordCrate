import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, User as UserIcon, Music } from 'lucide-react';
import { backend } from '../services/backend';
import type { AlbumReview } from '../types';
import '../styles/pages/Reviews.css';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'recent' | 'top-rated' | 'most-discussed'>('recent');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Reviews] Fetching all reviews from backend...');
      const data = await backend.getAllReviews();
      console.log('[Reviews] Reviews loaded:', data);
      console.log('[Reviews] Number of reviews:', Array.isArray(data) ? data.length : 0);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Reviews] Failed to load reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load reviews: ${errorMessage}. Please ensure the backend server is running.`);
      setReviews([]);
    } finally {
      setLoading(false);
    }
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

  const percentColor = (p: number) => {
    const n = Number(p) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(n))) / 100;
    const hue = Math.round(pct * 120);
    return `hsl(${hue}, 100%, 45%)`;
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (filter) {
      case 'top-rated':
        return (b.overallRating || 0) - (a.overallRating || 0);
      case 'most-discussed':
        return (b.writeup?.length || 0) - (a.writeup?.length || 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading reviews...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <div className="container">
        <div className="reviews-header">
          <div className="reviews-hero">
            <h1>Community Reviews</h1>
            <p>Explore what the RecordCrate community is listening to and loving</p>
          </div>

          <div className="reviews-filters">
            <button
              className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
              onClick={() => setFilter('recent')}
            >
              <Calendar size={18} />
              Recent
            </button>
            <button
              className={`filter-btn ${filter === 'top-rated' ? 'active' : ''}`}
              onClick={() => setFilter('top-rated')}
            >
              <Star size={18} />
              Top Rated
            </button>
            <button
              className={`filter-btn ${filter === 'most-discussed' ? 'active' : ''}`}
              onClick={() => setFilter('most-discussed')}
            >
              <UserIcon size={18} />
              Most Discussed
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!error && sortedReviews.length === 0 && (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to share your thoughts on an album!</p>
          </div>
        )}

        <div className="reviews-grid">
          {sortedReviews.map((review) => {
            // Access album metadata - handle both backend format and local storage format
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
                <div className="review-user">
                  <UserIcon size={16} />
                  {review.userSpotifyId ? (
                    <Link to={`/user/${review.userSpotifyId}`} className="user-link">
                      {review.user?.displayName || 'Anonymous'}
                    </Link>
                  ) : (
                    <span>{review.user?.displayName || 'Anonymous'}</span>
                  )}
                </div>
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
      </div>
    </div>
  );
};
