import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { StarRating } from './StarRating';
import type { Review, SpotifyAlbum } from '../types';

// rest of the file stays the same
interface ReviewFormProps {
  album: SpotifyAlbum;
  existingReview?: Review;
  onSubmit: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  album,
  existingReview,
  onSubmit,
  onCancel,
}) => {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    onSubmit({
      albumId: album.id,
      userId: user?.sub || 'anonymous',
      rating,
      content,
      album,
    });
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="review-form">
        <h3>Login Required</h3>
        <p>You need to be logged in to write reviews.</p>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => loginWithRedirect()}
            className="submit-btn"
          >
            Login to Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form">
      <h3>
        {existingReview ? 'Edit Review' : 'Write a Review'} for {album.name}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="rating-section">
          <label>Rating:</label>
          <StarRating 
            rating={rating} 
            onRatingChange={setRating} 
            size={24}
            readonly={!isAuthenticated}
          />
        </div>

        <div className="content-section">
          <label htmlFor="review-content">Review:</label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this album..."
            rows={6}
            disabled={!isAuthenticated}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isAuthenticated || rating === 0}
            className="submit-btn"
          >
            {existingReview ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};