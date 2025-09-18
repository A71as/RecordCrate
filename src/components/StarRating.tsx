import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 20,
}) => {
  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
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