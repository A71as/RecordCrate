import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, User as UserIcon, Music, Share2 } from 'lucide-react';
import { backend } from '../services/backend';
import { ReviewShareCard } from '../components/ReviewShareCard';
import type { AlbumReview } from '../types';
import { ReviewGridSkeleton } from '../components/ReviewCardSkeleton';
import '../styles/pages/Reviews.css';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'recent' | 'top-rated' | 'most-discussed'>('recent');
  const [shareReview, setShareReview] = useState<AlbumReview | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  useEffect(() => {
    loadReviews();
  }, []);

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

  // Optimized sorting with useMemo to prevent unnecessary re-sorts
  const sortedReviews = useMemo(() => {
    const reviewsCopy = [...reviews];
    
    switch (filter) {
      case 'top-rated':
        return reviewsCopy.sort((a, b) => {
          const ratingDiff = (b.overallRating || 0) - (a.overallRating || 0);
          // Secondary sort by date if ratings are equal
          if (ratingDiff === 0) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return ratingDiff;
        });
      
      case 'most-discussed':
        return reviewsCopy.sort((a, b) => {
          const lengthDiff = (b.writeup?.length || 0) - (a.writeup?.length || 0);
          // Secondary sort by rating if writeup lengths are equal
          if (lengthDiff === 0) {
            return (b.overallRating || 0) - (a.overallRating || 0);
          }
          return lengthDiff;
        });
      
      case 'recent':
      default:
        return reviewsCopy.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return dateB - dateA;
        });
    }
  }, [reviews, filter]);

  // Calculate filter statistics
  const filterStats = useMemo(() => {
    const topRated = reviews.filter(r => (r.overallRating || 0) >= 80);
    const withDiscussion = reviews.filter(r => (r.writeup?.length || 0) > 100);
    
    return {
      total: reviews.length,
      topRated: topRated.length,
      withDiscussion: withDiscussion.length,
    };
  }, [reviews]);

  const handleFilterChange = (newFilter: typeof filter) => {
    if (newFilter === filter) return;
    
    setIsTransitioning(true);
    setFilter(newFilter);
    
    // Reset transition after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="container">
          <div className="reviews-header">
            <div className="reviews-hero">
              <h1>Community Reviews</h1>
              <p>Explore what the RecordCrate community is listening to and loving</p>
            </div>
          </div>
          <div className="reviews-grid">
            <ReviewGridSkeleton count={9} />
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
              onClick={() => handleFilterChange('recent')}
              aria-label={`Sort by recent reviews (${filterStats.total} total)`}
            >
              <Calendar size={18} />
              <span className="filter-btn-text">
                Recent
                <span className="filter-count">{filterStats.total}</span>
              </span>
            </button>
            <button
              className={`filter-btn ${filter === 'top-rated' ? 'active' : ''}`}
              onClick={() => handleFilterChange('top-rated')}
              aria-label={`Sort by top rated reviews (${filterStats.topRated} highly rated)`}
            >
              <Star size={18} />
              <span className="filter-btn-text">
                Top Rated
                <span className="filter-count">{filterStats.topRated}</span>
              </span>
            </button>
            <button
              className={`filter-btn ${filter === 'most-discussed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('most-discussed')}
              aria-label={`Sort by most discussed reviews (${filterStats.withDiscussion} detailed)`}
            >
              <UserIcon size={18} />
              <span className="filter-btn-text">
                Most Discussed
                <span className="filter-count">{filterStats.withDiscussion}</span>
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: 'var(--rc-red-light)', 
            border: '2px solid var(--rc-red)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '1rem', color: 'var(--rc-red)', fontWeight: '600' }}>
              {error}
            </p>
            <button 
              onClick={() => loadReviews()}
              className="btn btn-primary btn-sm"
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {!error && sortedReviews.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Star size={40} />
            </div>
            <h3>No Reviews Yet</h3>
            <p>
              Be the first to share your thoughts! Search for an album and write a review to get started.
            </p>
          </div>
        )}

        <div className={`reviews-grid ${isTransitioning ? 'transitioning' : ''}`}>
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

              <div className="review-card-actions">
                <Link to={`/album/${review.albumId}`} className="view-album-btn">
                  View Album
                </Link>
                <button 
                  className="share-review-btn"
                  onClick={() => setShareReview(review)}
                  aria-label="Share review"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {shareReview && (
          <ReviewShareCard
            review={shareReview}
            album={{
              id: shareReview.albumId,
              name: shareReview.albumName || shareReview.album?.name || 'Unknown Album',
              artists: shareReview.albumArtists
                ? shareReview.albumArtists.map((name: string) => ({ name }))
                : shareReview.album?.artists || [{ name: 'Unknown Artist' }],
              images: shareReview.albumImage
                ? [{ url: shareReview.albumImage, height: 640, width: 640 }]
                : shareReview.album?.images || [],
            }}
            userName={shareReview.user?.displayName || 'Anonymous'}
            onClose={() => setShareReview(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Reviews;
