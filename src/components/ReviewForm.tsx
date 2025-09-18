import React, { useState } from 'react';
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
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    onSubmit({
      albumId: album.id,
      userId: 'current-user', // In a real app, get from auth
      rating,
      content,
      album,
    });
  };

  return (
    <div className="review-form">
      <h3>
        {existingReview ? 'Edit Review' : 'Write a Review'} for {album.name}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="rating-section">
          <label>Rating:</label>
          <StarRating rating={rating} onRatingChange={setRating} size={24} />
        </div>

        <div className="content-section">
          <label htmlFor="review-content">Review:</label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this album..."
            rows={6}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            disabled={rating === 0}
            className="submit-btn"
          >
            {existingReview ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};