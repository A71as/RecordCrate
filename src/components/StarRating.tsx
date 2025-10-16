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
  // For each star index (1..maxRating) compute how much of that star is filled (0..1)
  const fractionForStar = (star: number) =>
    Math.min(Math.max(rating - (star - 1), 0), 1);

  const handleClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    star: number
  ) => {
    if (readonly || !onRatingChange) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedFraction = clickX / rect.width;
    // Decide half or full depending on click position
    const newRating = (star - 1) + (clickedFraction <= 0.5 ? 0.5 : 1);
    // snap to nearest 0.5
    onRatingChange(Math.round(newRating * 2) / 2);
  };

  return (
    <div className="star-rating" style={{ display: 'inline-flex', gap: 4 }}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const frac = fractionForStar(star);
        return (
          <div
            key={star}
            className={`star-wrapper ${!readonly ? 'interactive' : ''}`}
            style={{
              width: size,
              height: size,
              display: 'inline-block',
              position: 'relative',
              lineHeight: 0,
              cursor: readonly ? 'default' : 'pointer',
            }}
            onClick={(e) => handleClick(e, star)}
            role={readonly ? undefined : 'button'}
            tabIndex={readonly ? -1 : 0}
            onKeyDown={(e) => {
              if (readonly || !onRatingChange) return;
              if (e.key === 'Enter' || e.key === ' ') {
                // toggle full/half on keyboard (prefer full)
                const newRating = star;
                onRatingChange(Math.round(newRating * 2) / 2);
              }
            }}
          >
            {/* base (empty) star */}
            <Star size={size} color="#ccc" fill="none" />

            {/* filled overlay clipped to fraction */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${frac * 100}%`,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <Star size={size} color="#ffd700" fill="#ffd700" />
            </div>
          </div>
        );
      })}
    </div>
  );
};