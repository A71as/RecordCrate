import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Clock } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import { StarRating } from '../components/StarRating';
import type { SpotifyAlbum, SongRating, AlbumReview } from '../types';

export const AlbumDetail: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songRatings, setSongRatings] = useState<{ [trackId: string]: number }>({});
  const [overallRating, setOverallRating] = useState(0);
  const [writeup, setWriteup] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [existingReview, setExistingReview] = useState<AlbumReview | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;

      try {
        setLoading(true);
        setError(null);
        const albumData = await spotifyService.getAlbumWithTracks(albumId);
        setAlbum(albumData);

        // Load existing review if any
        const savedReviews = JSON.parse(localStorage.getItem('albumReviews') || '[]');
        const review = savedReviews.find((r: AlbumReview) => r.albumId === albumId);
        
        if (review) {
          setExistingReview(review);
          setOverallRating(review.overallRating);
          setWriteup(review.writeup);
          
          const ratingsMap: { [trackId: string]: number } = {};
          review.songRatings.forEach((sr: SongRating) => {
            ratingsMap[sr.trackId] = sr.rating;
          });
          setSongRatings(ratingsMap);
        }
      } catch (err) {
        setError('Failed to fetch album details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  const calculateOverallRating = (ratings: { [trackId: string]: number }) => {
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) return 0;
    return Math.round(ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length);
  };

  const handleSongRatingChange = (trackId: string, rating: number) => {
    const newRatings = { ...songRatings, [trackId]: rating };
    setSongRatings(newRatings);
    setOverallRating(calculateOverallRating(newRatings));
  };

  const handleOverallRatingChange = (rating: number) => {
    setOverallRating(rating);
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!album?.tracks?.items) return '';
    const totalMs = album.tracks.items.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const totalSeconds = Math.floor((totalMs % 60000) / 1000);
    return `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
  };

  const handleSaveReview = () => {
    if (!album) return;

    const songRatingsArray: SongRating[] = Object.entries(songRatings).map(([trackId, rating]) => {
      const track = album.tracks?.items.find(t => t.id === trackId);
      return {
        trackId,
        trackName: track?.name || '',
        rating
      };
    });

    const review: AlbumReview = {
      id: existingReview?.id || Date.now().toString(),
      albumId: album.id,
      userId: 'current-user', // In real app, this would be the logged-in user's ID
      overallRating,
      songRatings: songRatingsArray,
      writeup,
      createdAt: existingReview?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      album
    };

    // Save to localStorage (in real app, this would go to a backend)
    const savedReviews = JSON.parse(localStorage.getItem('albumReviews') || '[]');
    const existingIndex = savedReviews.findIndex((r: AlbumReview) => r.albumId === album.id);
    
    if (existingIndex >= 0) {
      savedReviews[existingIndex] = review;
    } else {
      savedReviews.push(review);
    }
    
    localStorage.setItem('albumReviews', JSON.stringify(savedReviews));
    setExistingReview(review);
    setIsReviewing(false);
  };

  const handleCancelReview = () => {
    setIsReviewing(false);
    if (existingReview) {
      setOverallRating(existingReview.overallRating);
      setWriteup(existingReview.writeup);
      const ratingsMap: { [trackId: string]: number } = {};
      existingReview.songRatings.forEach(sr => {
        ratingsMap[sr.trackId] = sr.rating;
      });
      setSongRatings(ratingsMap);
    } else {
      setSongRatings({});
      setOverallRating(0);
      setWriteup('');
    }
  };

  if (loading) return <div className="loading">Loading album...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!album) return <div className="error">Album not found</div>;

  const albumImage = album.images?.[0]?.url || album.images?.[1]?.url;

  return (
    <div className="album-detail">
      <div className="container">
        <button className="back-button" onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/');
          }
        }}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="album-header">
          <div className="album-artwork">
            {albumImage && (
              <img src={albumImage} alt={album.name} />
            )}
          </div>
          
          <div className="album-info">
            <h1 className="album-title">{album.name}</h1>
            <div className="album-artists">
              {album.artists.map((artist, index) => (
                <span key={artist.id}>
                  {artist.name}
                  {index < album.artists.length - 1 && ', '}
                </span>
              ))}
            </div>
            <div className="album-meta">
              <span className="release-date">{new Date(album.release_date).getFullYear()}</span>
              <span className="track-count">{album.total_tracks} tracks</span>
              <span className="duration">{getTotalDuration()}</span>
            </div>
            
            {existingReview && !isReviewing && (
              <div className="existing-review-summary">
                <div className="overall-rating">
                  <span>Your Rating: </span>
                  <StarRating 
                    rating={existingReview.overallRating} 
                    readonly={true} 
                    maxRating={10}
                  />
                  <span className="rating-number">({existingReview.overallRating}/10)</span>
                </div>
              </div>
            )}
            
            <div className="album-actions">
              <button 
                className="review-button"
                onClick={() => setIsReviewing(!isReviewing)}
              >
                <Star size={20} />
                {existingReview ? 'Edit Review' : 'Write Review'}
              </button>
            </div>
          </div>
        </div>

        {album.tracks?.items && (
          <div className="tracklist-section">
            <h2>Tracks</h2>
            <div className="tracklist">
              {album.tracks.items.map((track) => (
                <div key={track.id} className="track-item">
                  <div className="track-number">{track.track_number}</div>
                  <div className="track-info">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artists">
                      {track.artists.map((artist, index) => (
                        <span key={artist.id}>
                          {artist.name}
                          {index < track.artists.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isReviewing && (
                    <div className="track-rating">
                      <StarRating
                        rating={songRatings[track.id] || 0}
                        maxRating={10}
                        onRatingChange={(rating) => handleSongRatingChange(track.id, rating)}
                        readonly={false}
                        size={14}
                      />
                    </div>
                  )}
                  <div className="track-duration">
                    <Clock size={14} />
                    {formatDuration(track.duration_ms)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isReviewing && (
          <div className="review-section">
            <h2>Write Your Review</h2>
            <div className="review-form">
              <div className="overall-rating-section">
                <label>Overall Album Rating:</label>
                <StarRating
                  rating={overallRating}
                  maxRating={10}
                  onRatingChange={handleOverallRatingChange}
                  readonly={false}
                />
                <span className="rating-number">({overallRating}/10)</span>
              </div>
              
              <div className="writeup-section">
                <label htmlFor="writeup">Your Thoughts (up to 350 words):</label>
                <textarea
                  id="writeup"
                  value={writeup}
                  onChange={(e) => setWriteup(e.target.value.slice(0, 1400))} // ~350 words
                  placeholder="Share your thoughts about this album..."
                  rows={6}
                />
                <div className="character-count">
                  {writeup.length}/1400 characters (~{Math.ceil(writeup.split(' ').length)} words)
                </div>
              </div>
              
              <div className="review-actions">
                <button className="cancel-btn" onClick={handleCancelReview}>
                  Cancel
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleSaveReview}
                  disabled={overallRating === 0}
                >
                  Save Review
                </button>
              </div>
            </div>
          </div>
        )}

        {existingReview && !isReviewing && (
          <div className="existing-review">
            <h2>Your Review</h2>
            <div className="review-content">
              <div className="review-rating">
                <StarRating 
                  rating={existingReview.overallRating} 
                  maxRating={10}
                  readonly={true} 
                />
                <span className="rating-number">({existingReview.overallRating}/10)</span>
              </div>
              {existingReview.writeup && (
                <div className="review-writeup">
                  <p>{existingReview.writeup}</p>
                </div>
              )}
              <div className="review-meta">
                Reviewed on {new Date(existingReview.createdAt).toLocaleDateString()}
                {existingReview.updatedAt !== existingReview.createdAt && (
                  <span> • Updated {new Date(existingReview.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};