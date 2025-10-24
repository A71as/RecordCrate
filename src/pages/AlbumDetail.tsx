import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Clock } from "lucide-react";
import { spotifyService } from "../services/spotify";
import { StarRating } from "../components/StarRating";
import type { SpotifyAlbum, SongRating, AlbumReview } from "../types";

type ModifierState = {
  emotionalStoryConnection: number;
  cohesionAndFlow: number;
  artistIdentityOriginality: number;
  visualAestheticEcosystem: number;
};

export const AlbumDetail: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songRatings, setSongRatings] = useState<{ [trackId: string]: number }>(
    {}
  );
  const [overallRating, setOverallRating] = useState(0);
  const [writeup, setWriteup] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [existingReview, setExistingReview] = useState<AlbumReview | null>(
    null
  );
  const [reviewCount, setReviewCount] = useState(0);
  // Score modifiers: signed percentages (-10..+10) per category
  const [modifiers, setModifiers] = useState<ModifierState>({
    emotionalStoryConnection: 0,
    cohesionAndFlow: 0,
    artistIdentityOriginality: 0,
    visualAestheticEcosystem: 0,
  });

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;

      try {
        setLoading(true);
        setError(null);
        const albumData = await spotifyService.getAlbumWithTracks(albumId);
        setAlbum(albumData);

        // Load existing review if any
        const savedReviews = JSON.parse(
          localStorage.getItem("albumReviews") || "[]"
        );
        const albumReviews = savedReviews.filter(
          (r: AlbumReview) => r.albumId === albumId
        );
        setReviewCount(albumReviews.length);

        const review = albumReviews[0];
        if (review) {
          // migrate older 0-5 scale to 0-100% if necessary
          const migratedOverall =
            typeof review.overallRating === 'number' && review.overallRating <= 5
              ? Math.round(review.overallRating * 20)
              : Math.round(review.overallRating || 0);
          review.overallRating = migratedOverall;
          // prefer base overall if stored
          const baseOverall = typeof (review as AlbumReview).baseOverallRating === 'number'
            ? Math.round((review as AlbumReview).baseOverallRating as number)
            : migratedOverall;
          setExistingReview(review);
          setOverallRating(baseOverall);
          setWriteup(review.writeup);

          // restore modifiers (optional in legacy reviews) with clamping to ±5
          setModifiers({
            emotionalStoryConnection: Math.max(-5, Math.min(5, review.scoreModifiers?.emotionalStoryConnection ?? 0)),
            cohesionAndFlow: Math.max(-5, Math.min(5, review.scoreModifiers?.cohesionAndFlow ?? 0)),
            artistIdentityOriginality: Math.max(-5, Math.min(5, review.scoreModifiers?.artistIdentityOriginality ?? 0)),
            visualAestheticEcosystem: Math.max(-5, Math.min(5, review.scoreModifiers?.visualAestheticEcosystem ?? 0)),
          });

          const ratingsMap: { [trackId: string]: number } = {};
          review.songRatings.forEach((sr: SongRating) => {
            ratingsMap[sr.trackId] = sr.rating;
          });
          setSongRatings(ratingsMap);
        } else {
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
    const avg =
      ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
    // convert average (1-5) to percent (0-100) and round
    return Math.round((avg / 5) * 100);
  };

  const handleSongRatingChange = (trackId: string, rating: number) => {
    const newRatings = { ...songRatings, [trackId]: rating };
    setSongRatings(newRatings);
    setOverallRating(calculateOverallRating(newRatings));
  };

  const handleOverallRatingChange = (rating: number) => {
    // clamp to 0-100 percent
    const snapped = Math.max(0, Math.min(100, Math.round(rating)));
    setOverallRating(snapped);
  };

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

  const handleSaveReview = () => {
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
      userId: "current-user", // In real app, this would be the logged-in user's ID
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

    // Save to localStorage (in real app, this would go to a backend)
    const savedReviews = JSON.parse(
      localStorage.getItem("albumReviews") || "[]"
    );
    const existingIndex = savedReviews.findIndex(
      (r: AlbumReview) => r.albumId === album.id
    );

    if (existingIndex >= 0) {
      savedReviews[existingIndex] = review;
    } else {
      savedReviews.push(review);
    }

    localStorage.setItem("albumReviews", JSON.stringify(savedReviews));
    setReviewCount(
      savedReviews.filter((r: AlbumReview) => r.albumId === album.id).length
    );
    setExistingReview(review);
    setIsReviewing(false);
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

  const handleCancelReview = () => {
    setIsReviewing(false);
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
  };

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

        <div className="album-header">
          <div className="album-artwork">
            {albumImage && <img src={albumImage} alt={album.name} />}
          </div>

          <div className="album-info">
            <h1 className="album-title">{album.name}</h1>
            <div className="album-artists">
              {album.artists.map((artist, index) => (
                <span key={artist.id}>
                  {artist.name}
                  {index < album.artists.length - 1 && ", "}
                </span>
              ))}
            </div>
            <div className="album-meta">
              <span className="release-date">
                {new Date(album.release_date).getFullYear()}
              </span>
              <span className="track-count">{album.total_tracks} tracks</span>
              <span className="duration">{getTotalDuration()}</span>
            </div>

            {existingReview && !isReviewing && (
              <div className="existing-review-summary">
                <div className="overall-rating">
                  <span>Your Rating: </span>
                  <div className="percent-badge">
                    {existingReview.overallRating}%
                  </div>
                  <div className="percent-bar" style={{ marginLeft: 8 }}>
                    <div className="percent-fill"
                      style={{
                        width: `${existingReview.overallRating}%`,
                        background: percentColor(existingReview.overallRating),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="album-actions">
              <button
                className="review-button"
                onClick={() => setIsReviewing(!isReviewing)}
              >
                <Star size={20} />
                {existingReview ? "Edit Review" : "Write Review"}
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
                          {index < track.artists.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isReviewing && (
                    <div className="track-rating">
                      <StarRating
                        rating={songRatings[track.id] || 0}
                        maxRating={5}
                        onRatingChange={(rating) =>
                          handleSongRatingChange(track.id, rating)
                        }
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
                <label htmlFor="overall-percent">Base Overall Album Rating:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      id="overall-percent"
                      type="range"
                      min={0}
                      max={100}
                      value={overallRating}
                      onChange={(e) => handleOverallRatingChange(Number(e.target.value))}
                    />
                    <div className="percent-badge">{overallRating}%</div>
                  </div>
                </div>
                {/* Score Modifiers */}
                <div className="modifiers-section">
                  <div className="modifiers-header">
                    <span>Score Modifiers (±5% each, step 2.5%)</span>
                    <span className="modifiers-total">Total: {formatSigned(totalModifier())}</span>
                  </div>
                  <div className="modifier-row">
                    <label>Emotional/story connection</label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('emotionalStoryConnection', -2.5)}
                        disabled={modifiers.emotionalStoryConnection <= -5}
                      >-2.5%</button>
                      <span className="modifier-value">{formatSigned(modifiers.emotionalStoryConnection)}</span>
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('emotionalStoryConnection', 2.5)}
                        disabled={modifiers.emotionalStoryConnection >= 5}
                      >+2.5%</button>
                    </div>
                  </div>
                  <div className="modifier-row">
                    <label>Cohesion and flow</label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('cohesionAndFlow', -2.5)}
                        disabled={modifiers.cohesionAndFlow <= -5}
                      >-2.5%</button>
                      <span className="modifier-value">{formatSigned(modifiers.cohesionAndFlow)}</span>
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('cohesionAndFlow', 2.5)}
                        disabled={modifiers.cohesionAndFlow >= 5}
                      >+2.5%</button>
                    </div>
                  </div>
                  <div className="modifier-row">
                    <label>Artist identity and originality</label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('artistIdentityOriginality', -2.5)}
                        disabled={modifiers.artistIdentityOriginality <= -5}
                      >-2.5%</button>
                      <span className="modifier-value">{formatSigned(modifiers.artistIdentityOriginality)}</span>
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('artistIdentityOriginality', 2.5)}
                        disabled={modifiers.artistIdentityOriginality >= 5}
                      >+2.5%</button>
                    </div>
                  </div>
                  <div className="modifier-row">
                    <label>Visual/aesthetic ecosystem</label>
                    <div className="modifier-control">
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('visualAestheticEcosystem', -2.5)}
                        disabled={modifiers.visualAestheticEcosystem <= -5}
                      >-2.5%</button>
                      <span className="modifier-value">{formatSigned(modifiers.visualAestheticEcosystem)}</span>
                      <button
                        type="button"
                        className="modifier-btn"
                        onClick={() => adjustModifier('visualAestheticEcosystem', 2.5)}
                        disabled={modifiers.visualAestheticEcosystem >= 5}
                      >+2.5%</button>
                    </div>
                  </div>
                  <div className="adjusted-summary">
                    <div>Final Rating with Modifiers:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="percent-badge">{adjustedOverall()}%</div>
                      <div className="percent-bar" style={{ marginLeft: 8 }}>
                        <div className="percent-fill" style={{ width: `${adjustedOverall()}%`, background: percentColor(adjustedOverall()) }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="writeup-section">
                  <label htmlFor="writeup">Your Thoughts (up to 350 words):</label>
                  <textarea
                    id="writeup"
                    value={writeup}
                    onChange={(e) => setWriteup(e.target.value.slice(0, 1400))}
                    placeholder="Share your thoughts about this album..."
                    rows={6}
                  />
                  <div className="character-count">
                    {writeup.length}/1400 characters (~{Math.ceil(writeup.split(' ').length)} words)
                  </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="percent-badge">{existingReview.overallRating}%</div>
                  <div
                    style={{
                      width: 140,
                      height: 8,
                      background: 'color-mix(in srgb, var(--panel-bg) 14%, transparent)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div className="percent-fill"
                      style={{
                        width: `${existingReview.overallRating}%`,
                        background: percentColor(existingReview.overallRating),
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Modifiers breakdown if present */}
              {existingReview.scoreModifiers && (
                <div className="review-modifiers">
                  {(() => {
                    const mods = existingReview.scoreModifiers || {};
                    const esc = clampMod(mods.emotionalStoryConnection ?? 0);
                    const caf = clampMod(mods.cohesionAndFlow ?? 0);
                    const aio = clampMod(mods.artistIdentityOriginality ?? 0);
                    const vae = clampMod(mods.visualAestheticEcosystem ?? 0);
                    const total = esc + caf + aio + vae;
                    const finalAdjusted = Math.round(existingReview.adjustedOverallRating ?? existingReview.overallRating);
                    const base = Math.max(0, Math.min(100, Math.round((existingReview.baseOverallRating ?? (finalAdjusted - total)))));
                    return (
                      <>
                        <div className="modifiers-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Score Modifiers</span>
                          <span className="modifiers-total">Total: {formatSigned(total)}</span>
                        </div>
                        <div className="modifier-list">
                          <div className="modifier-item">
                            <span className="label">Emotional/story connection</span>
                            <span className="value">{formatSigned(esc)}</span>
                          </div>
                          <div className="modifier-item">
                            <span className="label">Cohesion and flow</span>
                            <span className="value">{formatSigned(caf)}</span>
                          </div>
                          <div className="modifier-item">
                            <span className="label">Artist identity and originality</span>
                            <span className="value">{formatSigned(aio)}</span>
                          </div>
                          <div className="modifier-item">
                            <span className="label">Visual/aesthetic ecosystem</span>
                            <span className="value">{formatSigned(vae)}</span>
                          </div>
                          <div className="modifier-item modifier-total">
                            <span className="label">Base → Final</span>
                            <span className="value">{base}% → {finalAdjusted}%</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              {existingReview.writeup && (
                <div className="review-writeup">
                  <p>{existingReview.writeup}</p>
                </div>
              )}
              <div className="review-meta">
                Reviewed on{" "}
                {new Date(existingReview.createdAt).toLocaleDateString()}
                {existingReview.updatedAt !== existingReview.createdAt && (
                  <span>
                    {" "}
                    • Updated{" "}
                    {new Date(existingReview.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
