import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  maxRating?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 20,
  maxRating = 5,
}) => {
  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="star-rating">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <Star
          key={star}
          size={size}
          className={`star ${star <= rating ? 'filled' : 'empty'} ${
            !readonly ? 'interactive' : ''
          }`}
          onClick={() => handleStarClick(star)}
          fill={star <= rating ? '#ffd700' : 'none'}
          color={star <= rating ? '#ffd700' : '#ccc'}
        />
      ))}
    </div>
  );
};