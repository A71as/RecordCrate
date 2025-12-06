import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { logger } from '../utils/logger';
import { Star, ArrowLeft, Clock, Share2, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { spotifyService } from "../services/spotify";
import { backend } from "../services/backend";
import { dailyRecommendationService } from "../services/dailyRecommendation";
import { StarRating } from "../components/StarRating";
import { ReviewShareCard } from "../components/ReviewShareCard";
import type { SpotifyAlbum, SongRating, AlbumReview } from "../types";
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/pages/AlbumDetail.css';

type ModifierState = {
  emotionalStoryConnection: number;
  cohesionAndFlow: number;
  artistIdentityOriginality: number;
  visualAestheticEcosystem: number;
};

// Backend review response shapes
type BackendScoreModifiers = {
  emotionalStoryConnection?: number;
  cohesionAndFlow?: number;
  artistIdentityOriginality?: number;
  visualAestheticEcosystem?: number;
};

type BackendSongRating = { trackId: string; trackName?: string; rating: number };

type BackendAlbumReview = {
  _id?: string;
  albumId: string;
  userSpotifyId: string;
  overallRating: number;
  baseOverallRating?: number;
  adjustedOverallRating?: number;
  scoreModifiers?: BackendScoreModifiers;
  songRatings?: BackendSongRating[];
  writeup?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const AlbumDetail: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [songRatings, setSongRatings] = useState<{ [trackId: string]: number }>(
    {}
  );
  const [overallRating, setOverallRating] = useState(0);
  const [writeup, setWriteup] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [existingReview, setExistingReview] = useState<AlbumReview | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Score modifiers: signed percentages (-10..+10) per category
  const [modifiers, setModifiers] = useState<ModifierState>({
    emotionalStoryConnection: 0,
    cohesionAndFlow: 0,
    artistIdentityOriginality: 0,
    visualAestheticEcosystem: 0,
  });
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const canRate = isAuthenticated;

  useEffect(() => {
    if (!canRate && isReviewing) {
      setIsReviewing(false);
    }
  }, [canRate, isReviewing]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!albumId || !currentUserId || !isReviewing) return;
    
    const draftKey = `review-draft-${albumId}-${currentUserId}`;
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          overallRating,
          modifiers,
          songRatings,
          writeup,
          timestamp: Date.now()
        }));
        logger.debug('[AlbumDetail] Draft auto-saved');
      } catch (err) {
        logger.error('[AlbumDetail] Failed to save draft:', err);
      }
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(timeoutId);
  }, [albumId, currentUserId, isReviewing, overallRating, modifiers, songRatings, writeup]);

  // Load draft on review start
  useEffect(() => {
    if (!albumId || !currentUserId || !isReviewing || existingReview) return;
    
    const draftKey = `review-draft-${albumId}-${currentUserId}`;
    try {
      const draftStr = localStorage.getItem(draftKey);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        const ageMinutes = (Date.now() - draft.timestamp) / 60000;
        
        // Only restore drafts less than 24 hours old
        if (ageMinutes < 1440) {
          setOverallRating(draft.overallRating || 0);
          setModifiers(draft.modifiers || {
            emotionalStoryConnection: 0,
            cohesionAndFlow: 0,
            artistIdentityOriginality: 0,
            visualAestheticEcosystem: 0,
          });
          setSongRatings(draft.songRatings || {});
          setWriteup(draft.writeup || '');
          logger.debug('[AlbumDetail] Draft restored from', Math.round(ageMinutes), 'minutes ago');
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (err) {
      logger.error('[AlbumDetail] Failed to load draft:', err);
    }
  }, [albumId, currentUserId, isReviewing, existingReview]);

  // Track unsaved changes
  useEffect(() => {
    if (!isReviewing) {
      setHasUnsavedChanges(false);
      return;
    }
    
    const hasChanges = overallRating > 0 || writeup.trim().length > 0 || Object.keys(songRatings).length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [isReviewing, overallRating, writeup, songRatings]);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;

      try {
        setLoading(true);
        setError(null);
        const albumData = await spotifyService.getAlbumWithTracks(albumId);
        setAlbum(albumData);

        // Use Auth0 authenticated user for backend sync
        let userId: string | null = null;
        if (isAuthenticated && user) {
          userId = user.sub || null;
          logger.debug('[AlbumDetail] Current Auth0 user ID:', userId);
          logger.debug('[AlbumDetail] User object:', user);
          setCurrentUserId(userId);
          // best-effort sync with Auth0 user data
          if (userId) {
            backend
              .syncUser({
                spotifyId: userId, // Use Auth0 ID as user identifier
                displayName: user.name || user.email || 'User',
                avatarUrl: user.picture,
              })
              .catch(() => {});
          }
        } else {
          setCurrentUserId(null);
        }

        // Load reviews from backend database
        if (userId) {
          try {
            logger.debug('[AlbumDetail] Fetching reviews for user:', userId, 'album:', albumId);
            const serverReviews = (await backend.getAlbumReviews(albumId)) as BackendAlbumReview[];
            logger.debug('[AlbumDetail] Server reviews:', serverReviews);
            setReviewCount(Array.isArray(serverReviews) ? serverReviews.length : 0);
            const my = Array.isArray(serverReviews)
              ? serverReviews.find((r) => r.userSpotifyId === userId)
              : null;
            logger.debug('[AlbumDetail] My review:', my);
            if (my) {
              const migratedOverall =
                typeof my.overallRating === 'number' && my.overallRating <= 5
                  ? Math.round(my.overallRating * 20)
                  : Math.round(my.overallRating || 0);
              const baseOverall =
                typeof my.baseOverallRating === 'number'
                  ? Math.round(my.baseOverallRating)
                  : migratedOverall;
              const mapped: AlbumReview = {
                id: my._id || `${my.userSpotifyId}:${my.albumId}`,
                albumId: my.albumId,
                userId: my.userSpotifyId,
                overallRating: migratedOverall,
                baseOverallRating: baseOverall,
                adjustedOverallRating: typeof my.adjustedOverallRating === 'number' ? Math.round(my.adjustedOverallRating) : migratedOverall,
                scoreModifiers: my.scoreModifiers || {},
                songRatings: (my.songRatings || []).map((sr: BackendSongRating) => ({
                  trackId: sr.trackId,
                  trackName: sr.trackName || '',
                  rating: sr.rating,
                })),
                writeup: my.writeup || '',
                createdAt: my.createdAt || new Date().toISOString(),
                updatedAt: my.updatedAt || my.createdAt || new Date().toISOString(),
                album: albumData,
              };
              setExistingReview(mapped);
              setOverallRating(baseOverall);
              setWriteup(mapped.writeup);
              setModifiers({
                emotionalStoryConnection: Math.max(-5, Math.min(5, mapped.scoreModifiers?.emotionalStoryConnection ?? 0)),
                cohesionAndFlow: Math.max(-5, Math.min(5, mapped.scoreModifiers?.cohesionAndFlow ?? 0)),
                artistIdentityOriginality: Math.max(-5, Math.min(5, mapped.scoreModifiers?.artistIdentityOriginality ?? 0)),
                visualAestheticEcosystem: Math.max(-5, Math.min(5, mapped.scoreModifiers?.visualAestheticEcosystem ?? 0)),
              });
              const ratingsMap: { [trackId: string]: number } = {};
              mapped.songRatings.forEach((sr: SongRating) => (ratingsMap[sr.trackId] = sr.rating));
              setSongRatings(ratingsMap);
              return; // done
            }
          } catch (err) {
            logger.error('[AlbumDetail] Error loading reviews:', err);
            setReviewCount(0);
          }
        } else {
          // No user logged in - just fetch review count
          try {
            const serverReviews = (await backend.getAlbumReviews(albumId)) as BackendAlbumReview[];
            setReviewCount(Array.isArray(serverReviews) ? serverReviews.length : 0);
          } catch {
            setReviewCount(0);
          }
        }

        // If no existing review found, reset form
        if (!existingReview) {
          setExistingReview(null);
          setSongRatings({});
          setOverallRating(0);
          setWriteup("");
          setModifiers({
            emotionalStoryConnection: 0,
            cohesionAndFlow: 0,
            artistIdentityOriginality: 0,
            visualAestheticEcosystem: 0,
          });
        }
      } catch (err) {
        setError("Failed to fetch album details");
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  const calculateOverallRating = (ratings: { [trackId: string]: number }) => {
    const ratingValues = Object.values(ratings);
    if (ratingValues.length === 0) return 0;
    const avg =
      ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
    // convert average (1-5) to percent (0-100) and round
    return Math.round((avg / 5) * 100);
  };

  const handleSongRatingChange = useCallback((trackId: string, rating: number) => {
    if (!canRate) return;
    const newRatings = { ...songRatings, [trackId]: rating };
    setSongRatings(newRatings);
    setOverallRating(calculateOverallRating(newRatings));
  }, [canRate, songRatings]);

  const handleOverallRatingChange = useCallback((rating: number) => {
    if (!canRate) return;
    // clamp to 0-100 percent
    const snapped = Math.max(0, Math.min(100, Math.round(rating)));
    setOverallRating(snapped);
  }, [canRate]);

  // Sum of all signed modifier percentages
  const totalModifier = () =>
    (modifiers.emotionalStoryConnection || 0) +
    (modifiers.cohesionAndFlow || 0) +
    (modifiers.artistIdentityOriginality || 0) +
    (modifiers.visualAestheticEcosystem || 0);

  // Final adjusted overall (clamped 0..100)
  const adjustedOverall = () => {
    const base = Number.isFinite(overallRating) ? overallRating : 0;
    const adj = base + totalModifier();
    return Math.max(0, Math.min(100, Math.round(adj)));
  };

  // Helpers for modifier adjustments/formatting
  const clampMod = (n: number) => Math.max(-5, Math.min(5, n));
  const round1 = (n: number) => Math.round(n * 10) / 10; // keep one decimal
  const adjustModifier = (key: keyof ModifierState, delta: number) =>
    setModifiers((m) => ({ ...m, [key]: clampMod(round1((m[key] ?? 0) + delta)) }));
  const formatSigned = (n: number) => `${n >= 0 ? "+" : ""}${round1(n).toFixed(Math.abs(round1(n) % 1) < 0.05 ? 0 : 1)}%`;

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = () => {
    if (!album?.tracks?.items) return "";
    const totalMs = album.tracks.items.reduce(
      (sum, track) => sum + track.duration_ms,
      0
    );
    const totalMinutes = Math.floor(totalMs / 60000);
    const totalSeconds = Math.floor((totalMs % 60000) / 1000);
    return `${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}`;
  };

  const handleSaveReview = async () => {
    if (!canRate) return;
    if (!album) return;

    const songRatingsArray: SongRating[] = Object.entries(songRatings).map(
      ([trackId, rating]) => {
        const track = album.tracks?.items.find((t) => t.id === trackId);
        return {
          trackId,
          trackName: track?.name || "",
          rating,
        };
      }
    );

    const finalAdjusted = adjustedOverall();
    const review: AlbumReview = {
      id: existingReview?.id || Date.now().toString(),
      albumId: album.id,
      userId: user?.sub || "anonymous", // Use Auth0 user ID
      overallRating: finalAdjusted,
      baseOverallRating: overallRating,
      adjustedOverallRating: finalAdjusted,
      scoreModifiers: { ...modifiers },
      songRatings: songRatingsArray,
      writeup,
      createdAt: existingReview?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      album,
    };

    // Must be logged in to save reviews
    if (!currentUserId) {
      alert('Please log in to save reviews');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      logger.debug('[AlbumDetail] Saving review for user:', currentUserId, 'album:', album.id);
      await backend.saveReview({
        userSpotifyId: currentUserId,
        albumId: album.id,
        overallRating: finalAdjusted,
        baseOverallRating: overallRating,
        adjustedOverallRating: finalAdjusted,
        scoreModifiers: { ...modifiers },
        songRatings: songRatingsArray,
        writeup,
        albumMeta: {
          name: album.name,
          artists: album.artists?.map((a) => a.name) || [],
          image: album.images?.[0]?.url || album.images?.[1]?.url,
        },
      });
      logger.debug('[AlbumDetail] Review saved successfully');
      
      // Clear draft from localStorage on successful save
      const draftKey = `review-draft-${album.id}-${currentUserId}`;
      localStorage.removeItem(draftKey);
      
      // Refresh count from server
      try {
        const list = (await backend.getAlbumReviews(album.id)) as BackendAlbumReview[];
        setReviewCount(Array.isArray(list) ? list.length : 0);
      } catch {
        // ignore refresh count errors
      }
      
      // Check if this album was today's daily recommendation and mark it as reviewed
      const today = new Date().toISOString().split('T')[0];
      if (dailyRecommendationService.isRecommendationForDate(today, album.id)) {
        dailyRecommendationService.markAsReviewed(today, album.id, review.id);
        logger.debug('[AlbumDetail] Marked today\'s recommendation as reviewed');
      }
      
      setExistingReview(review);
      setIsReviewing(false);
      setHasUnsavedChanges(false);
    } catch (e) {
      logger.error('Failed to save review:', e);
      const errorMessage = e instanceof Error ? e.message : 'Network error occurred';
      setSaveError(`Failed to save review: ${errorMessage}. Your work is saved locally - please try again.`);
      // Keep form open so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  // color gradient helper: returns an rgb string interpolated from red (0%) -> yellow (50%) -> green (100%)
  const percentColor = (p: number) => {
    // Robust HSL interpolation: hue 0 (red) -> 60 (yellow) -> 120 (green)
    const n = Number(p) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(n))) / 100;
    const hue = Math.round(pct * 120); // 0..120
    // keep saturation and lightness consistent
    return `hsl(${hue}, 100%, 45%)`;
  };

  const handleStartReview = useCallback(() => {
    setIsReviewing(true);
  }, []);

  const handleCancelReview = useCallback(() => {
    // Confirm if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel? Your work is auto-saved and will be restored if you start reviewing again."
      );
      if (!confirmCancel) return;
    }
    
    setIsReviewing(false);
    setSaveError(null);
    setHasUnsavedChanges(false);
    
    if (existingReview) {
      const base = typeof existingReview.baseOverallRating === 'number'
        ? Math.round(existingReview.baseOverallRating)
        : existingReview.overallRating;
      setOverallRating(base);
      setWriteup(existingReview.writeup);
      setModifiers({
        emotionalStoryConnection: Math.max(-5, Math.min(5, existingReview.scoreModifiers?.emotionalStoryConnection ?? 0)),
        cohesionAndFlow: Math.max(-5, Math.min(5, existingReview.scoreModifiers?.cohesionAndFlow ?? 0)),
        artistIdentityOriginality: Math.max(-5, Math.min(5, existingReview.scoreModifiers?.artistIdentityOriginality ?? 0)),
        visualAestheticEcosystem: Math.max(-5, Math.min(5, existingReview.scoreModifiers?.visualAestheticEcosystem ?? 0)),
      });
      const ratingsMap: { [trackId: string]: number } = {};
      existingReview.songRatings.forEach((sr) => {
        ratingsMap[sr.trackId] = sr.rating;
      });
      setSongRatings(ratingsMap);
    } else {
      setSongRatings({});
      setOverallRating(0);
      setWriteup("");
      setModifiers({
        emotionalStoryConnection: 0,
        cohesionAndFlow: 0,
        artistIdentityOriginality: 0,
        visualAestheticEcosystem: 0,
      });
    }
  }, [existingReview, hasUnsavedChanges]);

  const handleDeleteReview = useCallback(async () => {
    if (!album || !existingReview || !currentUserId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this review? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await backend.deleteReview(currentUserId, album.id);
      
      // Refresh review count from server
      try {
        const list = await backend.getAlbumReviews(album.id);
        setReviewCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setReviewCount(0);
      }

      // Reset state
      setExistingReview(null);
      setSongRatings({});
      setOverallRating(0);
      setWriteup("");
      setModifiers({
        emotionalStoryConnection: 0,
        cohesionAndFlow: 0,
        artistIdentityOriginality: 0,
        visualAestheticEcosystem: 0,
      });
      setIsReviewing(false);
    } catch (error) {
      logger.error('Failed to delete review:', error);
      alert('Failed to delete review. Please try again.');
    }
  }, [album, existingReview, currentUserId]);

  if (loading) return <div className="loading">Loading album...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!album) return <div className="error">Album not found</div>;

  const albumImage = album.images?.[0]?.url || album.images?.[1]?.url;

  const trackCount = album.tracks?.items?.length ?? album.total_tracks ?? 0;
  // Reduce padding multipliers to avoid huge gaps. Clamp to a sensible max.
  const BASE_PADDING_REM = 1; // base small offset
  const EXTRA_PADDING_PER_TRACK_REM = 0.25; // small incremental space per track
  const EXTRA_PADDING_PER_REVIEW_REM = 1.5; // each review adds modest space
  const MAX_PADDING_REM = 6; // don't let padding grow without bound

  const rawPadding =
    BASE_PADDING_REM +
    Math.max(trackCount - 1, 0) * EXTRA_PADDING_PER_TRACK_REM +
    reviewCount * EXTRA_PADDING_PER_REVIEW_REM;

  const paddingTop = `${Math.min(rawPadding, MAX_PADDING_REM)}rem`;

  return (
    <div className="album-detail" style={{ paddingTop }}>
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="album-hero">
          <div className="album-hero-background" style={{ backgroundImage: albumImage ? `url(${albumImage})` : 'none' }} />
          
          <div className="album-hero-content">
            <div className="album-artwork-wrapper">
              <div className="album-artwork-container">
                {albumImage && <img src={albumImage} alt={album.name} className="album-artwork-image" loading="lazy" />}
              </div>
            </div>

            <div className="album-hero-info">
              <div className="album-meta-tags">
                <span className="meta-tag">{album.release_date?.split("-")[0] || "Unknown"}</span>
                <span className="meta-tag">{trackCount} tracks</span>
                <span className="meta-tag">{getTotalDuration()}</span>
              </div>
              
              <h1 className="album-title-hero">{album.name}</h1>
              
              <div className="album-artists-hero">
                {album.artists.map((artist, index) => (
                  <React.Fragment key={artist.id}>
                    <button
                      type="button"
                      className="artist-link-hero"
                      onClick={() => navigate(`/artist/${artist.id}`)}
                    >
                      {artist.name}
                    </button>
                    {index < album.artists.length - 1 && <span className="artist-separator">•</span>}
                  </React.Fragment>
                ))}
              </div>

              {!isReviewing && !existingReview && canRate && (
                <button className="review-button-hero" onClick={handleStartReview}>
                  <Star size={20} fill="currentColor" />
                  Write a Review
                </button>
              )}
              
              {!canRate && !isReviewing && !existingReview && (
                <div className="login-prompt-hero">
                  <p>Sign in to review this album and share your thoughts</p>
                  <button className="auth-login-btn" onClick={() => loginWithRedirect()}>
                    Login to Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {album.tracks?.items && (
          <div className="tracklist-section">
            <div className="tracklist-header">
              <h2>Tracklist</h2>
              <span className="track-count-badge">{trackCount} songs</span>
            </div>
            <div className="tracklist">
              {album.tracks.items.map((track, _index) => (
                <div key={track.id} className="track-item">
                  <div className="track-number-col">
                    <span className="track-number">{track.track_number}</span>
                  </div>
                  <div className="track-info-col">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artists">
                      {track.artists.map((artist, idx) => (
                        <span key={artist.id}>
                          {artist.name}
                          {idx < track.artists.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isReviewing && canRate && (
                    <div className="track-rating-col">
                      <StarRating
                        rating={songRatings[track.id] || 0}
                        onRatingChange={(r) => handleSongRatingChange(track.id, r)}
                        size={24}
                      />
                    </div>
                  )}
                  <div className="track-duration-col">
                    <Clock size={14} />
                    <span>{formatDuration(track.duration_ms)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isReviewing && canRate && (
          <div className="review-section">
            <div className="review-section-header">
              <h2>Write Your Review</h2>
              <p className="review-subtitle">Share your detailed thoughts on this album</p>
            </div>
            
            {saveError && (
              <div className="error-banner" role="alert">
                <AlertCircle size={20} />
                <span>{saveError}</span>
                <button onClick={handleSaveReview} className="retry-btn">
                  Retry
                </button>
              </div>
            )}
            
            <div className="review-form">
              <div className="overall-rating-section">
                <div className="rating-header">
                  <label htmlFor="overall-percent">Base Album Rating</label>
                  <div className="rating-display">
                    <span className="rating-percent">{overallRating}%</span>
                  </div>
                </div>
                <div className="rating-scale-guide">
                  <span className="scale-label">90-100%: Masterpiece</span>
                  <span className="scale-label">70-89%: Great</span>
                  <span className="scale-label">50-69%: Good</span>
                  <span className="scale-label">30-49%: Fair</span>
                  <span className="scale-label">0-29%: Poor</span>
                </div>
                <input
                  id="overall-percent"
                  type="range"
                  min={0}
                  max={100}
                  value={overallRating}
                  onChange={(e) => handleOverallRatingChange(Number(e.target.value))}
                  className="rating-slider"
                  aria-valuetext={`${overallRating} percent`}
                  aria-label="Base album rating from 0 to 100 percent"
                />
                <div className="rating-bar-preview">
                  <div 
                    className="rating-bar-fill" 
                    style={{ 
                      width: `${overallRating}%`,
                      background: percentColor(overallRating)
                    }} 
                  />
                </div>
              </div>

              <div className="modifiers-section">
                <div className="modifiers-header">
                  <h3>Fine-tune Your Score</h3>
                  <span className="modifiers-total">
                    Total Adjustment: {formatSigned(totalModifier())}
                  </span>
                </div>
                <p className="modifiers-description">
                  Adjust your rating based on specific aspects (±5% each, in 2.5% increments)
                </p>
                
                <div className="modifier-grid">
                  <div className="modifier-card">
                    <label>
                      Emotional/Story Connection
                      <span className="help-tooltip" title="How well does the album connect emotionally? Does it tell a compelling story or evoke strong feelings?">
                        <HelpCircle size={16} />
                      </span>
                    </label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn minus"
                        onClick={() => adjustModifier('emotionalStoryConnection', -2.5)}
                        disabled={modifiers.emotionalStoryConnection <= -5}
                        aria-label="Decrease emotional connection rating"
                      >−</button>
                      <span className="modifier-value">{formatSigned(modifiers.emotionalStoryConnection)}</span>
                      <button
                        type="button"
                        className="modifier-btn plus"
                        onClick={() => adjustModifier('emotionalStoryConnection', 2.5)}
                        disabled={modifiers.emotionalStoryConnection >= 5}
                        aria-label="Increase emotional connection rating"
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="modifier-card">
                    <label>
                      Cohesion & Flow
                      <span className="help-tooltip" title="How well do the songs flow together? Is the track sequencing effective? Does the album feel cohesive?">
                        <HelpCircle size={16} />
                      </span>
                    </label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn minus"
                        onClick={() => adjustModifier('cohesionAndFlow', -2.5)}
                        disabled={modifiers.cohesionAndFlow <= -5}
                        aria-label="Decrease cohesion rating"
                      >−</button>
                      <span className="modifier-value">{formatSigned(modifiers.cohesionAndFlow)}</span>
                      <button
                        type="button"
                        className="modifier-btn plus"
                        onClick={() => adjustModifier('cohesionAndFlow', 2.5)}
                        disabled={modifiers.cohesionAndFlow >= 5}
                        aria-label="Increase cohesion rating"
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="modifier-card">
                    <label>
                      Artist Identity & Originality
                      <span className="help-tooltip" title="Does the artist demonstrate a unique voice? Is the work original and distinctive? How well does it represent their identity?">
                        <HelpCircle size={16} />
                      </span>
                    </label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn minus"
                        onClick={() => adjustModifier('artistIdentityOriginality', -2.5)}
                        disabled={modifiers.artistIdentityOriginality <= -5}
                        aria-label="Decrease originality rating"
                      >−</button>
                      <span className="modifier-value">{formatSigned(modifiers.artistIdentityOriginality)}</span>
                      <button
                        type="button"
                        className="modifier-btn plus"
                        onClick={() => adjustModifier('artistIdentityOriginality', 2.5)}
                        disabled={modifiers.artistIdentityOriginality >= 5}
                        aria-label="Increase originality rating"
                      >+</button>
                    </div>
                  </div>
                  
                  <div className="modifier-card">
                    <label>
                      Visual/Aesthetic Ecosystem
                      <span className="help-tooltip" title="Consider album artwork, music videos, artist branding, and overall aesthetic presentation. Does the visual identity enhance the musical experience?">
                        <HelpCircle size={16} />
                      </span>
                    </label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn minus"
                        onClick={() => adjustModifier('visualAestheticEcosystem', -2.5)}
                        disabled={modifiers.visualAestheticEcosystem <= -5}
                        aria-label="Decrease visual aesthetic rating"
                      >−</button>
                      <span className="modifier-value">{formatSigned(modifiers.visualAestheticEcosystem)}</span>
                      <button
                        type="button"
                        className="modifier-btn plus"
                        onClick={() => adjustModifier('visualAestheticEcosystem', 2.5)}
                        disabled={modifiers.visualAestheticEcosystem >= 5}
                        aria-label="Increase visual aesthetic rating"
                      >+</button>
                    </div>
                  </div>
                </div>
                
                <div className="final-score-preview">
                  <span className="final-score-label">Final Score:</span>
                  <span 
                    className="final-score-value"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {adjustedOverall()}%
                  </span>
                  <div className="final-score-breakdown">
                    {overallRating}% base {totalModifier() !== 0 && `${formatSigned(totalModifier())} adjustment`}
                  </div>
                </div>
              </div>

              <div className="writeup-section">
                <label htmlFor="writeup">Your Thoughts (Optional)</label>
                <textarea
                  id="writeup"
                  value={writeup}
                  onChange={(e) => setWriteup(e.target.value.slice(0, 1400))}
                  placeholder="What did you think of this album? Share your insights, favorite moments, and overall impressions..."
                  rows={8}
                  disabled={!canRate}
                  aria-describedby="char-count"
                />
                <div 
                  id="char-count"
                  className="character-count"
                  aria-live="polite"
                  style={{ 
                    color: writeup.length > 1300 ? 'var(--rc-red)' : 'var(--muted)',
                    fontWeight: writeup.length > 1300 ? '600' : '400'
                  }}
                >
                  {writeup.length} / 1400 characters
                  {writeup.length > 1300 && <span className="warning-text"> - Approaching limit!</span>}
                </div>
              </div>

              <div className="review-actions">
                <button className="cancel-btn btn btn-ghost" onClick={handleCancelReview}>
                  Cancel
                </button>
                <button
                  className="save-btn btn btn-primary"
                  onClick={handleSaveReview}
                  disabled={!canRate || overallRating === 0 || isSaving}
                  title={overallRating === 0 ? 'Please set an overall rating' : 'Save your review'}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Star size={18} fill="currentColor" />
                      {overallRating === 0 ? 'Set Rating First' : 'Save Review'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {existingReview && !isReviewing && (
          <div className="existing-review-card">
            <div className="review-card-header">
              <h2>Your Review</h2>
              <div className="review-card-actions">
                <button 
                  className="share-review-btn"
                  onClick={() => setShowShareCard(true)}
                >
                  <Share2 size={18} />
                  Share
                </button>
                <button 
                  className="delete-review-btn"
                  onClick={handleDeleteReview}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="review-card-content">
              <div className="review-score-display">
                <div className="score-badge-large">{existingReview.overallRating}%</div>
                <div className="score-bar-container">
                  <div 
                    className="score-bar-fill"
                    style={{
                      width: `${existingReview.overallRating}%`,
                      background: percentColor(existingReview.overallRating),
                    }}
                  />
                </div>
              </div>
              
              {existingReview.scoreModifiers && (
                <div className="review-modifiers-display">
                  <h3>Score Adjustments</h3>
                  <div className="modifiers-list">
                    {(() => {
                      const mods = existingReview.scoreModifiers || {};
                      const esc = clampMod(mods.emotionalStoryConnection ?? 0);
                      const caf = clampMod(mods.cohesionAndFlow ?? 0);
                      const aio = clampMod(mods.artistIdentityOriginality ?? 0);
                      const vae = clampMod(mods.visualAestheticEcosystem ?? 0);
                      return (
                        <>
                          {esc !== 0 && (
                            <div className="modifier-item-display">
                              <span>Emotional/Story Connection</span>
                              <span className={esc > 0 ? 'positive' : 'negative'}>{formatSigned(esc)}</span>
                            </div>
                          )}
                          {caf !== 0 && (
                            <div className="modifier-item-display">
                              <span>Cohesion & Flow</span>
                              <span className={caf > 0 ? 'positive' : 'negative'}>{formatSigned(caf)}</span>
                            </div>
                          )}
                          {aio !== 0 && (
                            <div className="modifier-item-display">
                              <span>Artist Identity & Originality</span>
                              <span className={aio > 0 ? 'positive' : 'negative'}>{formatSigned(aio)}</span>
                            </div>
                          )}
                          {vae !== 0 && (
                            <div className="modifier-item-display">
                              <span>Visual/Aesthetic Ecosystem</span>
                              <span className={vae > 0 ? 'positive' : 'negative'}>{formatSigned(vae)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {existingReview.writeup && (
                <div className="review-writeup-display">
                  <p>{existingReview.writeup}</p>
                </div>
              )}
              
              <div className="review-meta">
                <span>
                  Reviewed {existingReview.createdAt && new Date(existingReview.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                {existingReview.updatedAt && existingReview.updatedAt !== existingReview.createdAt && (
                  <span className="updated-badge">
                    Updated {new Date(existingReview.updatedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {showShareCard && existingReview && album && (
          <ReviewShareCard
            review={existingReview}
            album={album}
            userName={user?.name || user?.email || 'Anonymous'}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AlbumDetail;




