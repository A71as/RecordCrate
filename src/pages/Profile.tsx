import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Music, Star, Calendar } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import { useAuth } from '../context/useAuth';
import type { AlbumReview, SpotifyArtist, SpotifyTrack } from '../types';

export const Profile: React.FC = () => {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [followedArtists, setFollowedArtists] = useState<SpotifyArtist[]>([]);

  const { spotifyUser, isSpotifyLinked, linkSpotifyAccount, googleUser } = useAuth();

  useEffect(() => {
    const loadReviews = () => {
      const savedReviewsRaw = localStorage.getItem('albumReviews') || '[]';
      try {
        const savedReviewsArr = JSON.parse(savedReviewsRaw) as AlbumReview[];
        const migrated: AlbumReview[] = (savedReviewsArr || []).map((r) => {
          if (typeof r.overallRating === 'number' && r.overallRating <= 5) {
            return { ...r, overallRating: Math.round(r.overallRating * 20) };
          }
          return { ...r, overallRating: Math.round(r.overallRating || 0) };
        });
        setReviews(migrated);
      } catch (err) {
        console.error('Profile: Error parsing reviews:', err);
        setReviews([]);
      }
    };

    const loadSpotifyData = async () => {
      setLoading(true);
      try {
        if (isSpotifyLinked) {
          const [artistsData, tracksData, followedData] = await Promise.all([
            spotifyService.getPersonalTopArtists('6months'),
            spotifyService.getPersonalTopTracks('medium_term'),
            spotifyService.getFollowedArtists(),
          ]);
          setTopArtists(artistsData);
          setTopTracks(tracksData);
          setFollowedArtists(followedData);
        } else {
          setTopArtists([]);
          setTopTracks([]);
          setFollowedArtists([]);
        }
      } catch (err) {
        console.error('Profile: Error fetching Spotify data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
    void loadSpotifyData();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'spotify_access_token') {
        void loadSpotifyData();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isSpotifyLinked]);

  const handleLogin = () => {
    // Clear any existing expired tokens before redirecting
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    // Store current page to redirect back after login
    localStorage.setItem('spotify_redirect_after_login', window.location.pathname);
    linkSpotifyAccount();
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!isSpotifyLinked) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-content">
            <div className="login-prompt">
              <div className="login-hero">
                <div className="login-icon-stack">
                  <Music size={48} className="login-icon primary" />
                  <User size={32} className="login-icon secondary" />
                </div>
                <h1>Welcome to RecordCrate</h1>
                <p className="hero-subtitle">Your personal music collection and review platform</p>
              </div>
              
              <div className="login-features">
                <div className="feature-list">
                  <div className="feature-item">
                    <Star size={20} className="feature-icon" />
                    <span>Rate and review your favorite albums</span>
                  </div>
                  <div className="feature-item">
                    <Music size={20} className="feature-icon" />
                    <span>Discover new music from Spotify</span>
                  </div>
                  <div className="feature-item">
                    <User size={20} className="feature-icon" />
                    <span>Build your personal music profile</span>
                  </div>
                  <div className="feature-item">
                    <Calendar size={20} className="feature-icon" />
                    <span>Track your listening journey</span>
                  </div>
                </div>
              </div>

              <div className="login-action">
                <button className="spotify-login-btn large primary" onClick={handleLogin}>
                  <Music size={20} />
                  Connect with Spotify
                </button>
                <p className="login-note">
                  Connect your Spotify account to start building your music collection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // reviews[].overallRating is now stored as percent (0-100)
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length
    : 0;

  const percentColor = (p: number) => {
    const n = Number(p) || 0;
    const pct = Math.max(0, Math.min(100, Math.round(n))) / 100;
    const hue = Math.round(pct * 120);
    return `hsl(${hue}, 100%, 45%)`;
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          {spotifyUser ? (
            <div className="user-profile">
              {spotifyUser.images && spotifyUser.images[0] && (
                <img
                  src={spotifyUser.images[0].url}
                  alt={spotifyUser.display_name}
                  className="profile-avatar"
                />
              )}
              <div className="user-details">
                <h1>{spotifyUser.display_name}</h1>
                {googleUser && (
                  <p className="linked-account">Signed in as {googleUser.email}</p>
                )}
                <div className="user-stats">
                  <div className="stat">
                    <Music size={16} />
                    <span>{reviews.length} Reviews</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="stat">
                      <Star size={16} />
                      <span>Avg Rating: {averageRating.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="stat">
                    <User size={16} />
                    <span>{spotifyUser.followers?.total || 0} Followers</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="user-profile">
              <div className="user-details">
                <h1>Profile</h1>
                <div className="user-stats">
                  <div className="stat">
                    <Music size={16} />
                    <span>{reviews.length} Reviews</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="stat">
                      <Star size={16} />
                      <span>Avg Rating: {averageRating.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    Your Spotify session may have expired. Profile information is temporarily unavailable.
                  </p>
                  <button 
                    className="spotify-login-btn" 
                    onClick={handleLogin}
                    style={{ fontSize: '14px', padding: '0.5rem 1rem' }}
                  >
                    <Music size={16} />
                    Refresh Spotify Connection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-content">
          <section className="reviews-section">
            <h2>Your Album Reviews</h2>
            {reviews.length === 0 ? (
              <div className="empty-reviews">
                <Music size={48} className="empty-icon" />
                <h3>No reviews yet</h3>
                <p>Start reviewing albums to build your music collection!</p>
                <Link to="/search" className="search-link">
                  Search for Albums
                </Link>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <Link to={`/album/${review.albumId}`} className="review-link">
                      <div className="review-album-art">
                        {review.album?.images?.[0] && (
                          <img
                            src={review.album.images[0].url}
                            alt={review.album.name}
                          />
                        )}
                      </div>
                      <div className="review-details">
                        <h3 className="review-album-title">{review.album?.name}</h3>
                        <p className="review-album-artist">
                          {review.album?.artists.map(a => a.name).join(', ')}
                        </p>
                        <div className="review-rating">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="percent-badge">{review.overallRating}%</div>
                            <div style={{ width: 80, height: 8, background: 'color-mix(in srgb, var(--panel-bg) 14%, transparent)', borderRadius: 4, overflow: 'hidden' }}>
                              <div className="percent-fill" style={{ width: `${review.overallRating}%`, height: '100%', background: percentColor(review.overallRating) }} />
                            </div>
                          </div>
                        </div>
                        {review.writeup && (
                          <p className="review-excerpt">
                            {review.writeup.length > 100
                              ? `${review.writeup.substring(0, 100)}...`
                              : review.writeup
                            }
                          </p>
                        )}
                        <div className="review-date">
                          <Calendar size={14} />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Artists Section */}
          {topArtists.length > 0 && (
            <section className="top-artists-section">
              <h2>Your Top Artists</h2>
              <div className="artists-grid">
                {topArtists.slice(0, 8).map((artist) => (
                  <Link key={artist.id} to={`/artist/${artist.id}`} className="mini-artist-card">
                    <div className="artist-image">
                      {artist.images[0] && (
                        <img src={artist.images[0].url} alt={artist.name} />
                      )}
                    </div>
                    <span className="artist-name">{artist.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Tracks Section */}
          {topTracks.length > 0 && (
            <section className="top-tracks-section">
              <h2>Your Top Tracks</h2>
              <div className="tracks-list">
                {topTracks.slice(0, 10).map((track, index) => (
                  <div key={track.id} className="track-item">
                    <span className="track-number">{index + 1}</span>
                    <div className="track-info">
                      <span className="track-name">{track.name}</span>
                      <span className="track-artist">
                        {track.artists.map(artist => artist.name).join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Followed Artists Section */}
          {followedArtists.length > 0 && (
            <section className="followed-artists-section">
              <h2>Artists You Follow ({followedArtists.length})</h2>
              <div className="artists-grid">
                {followedArtists.slice(0, 12).map((artist) => (
                  <Link key={artist.id} to={`/artist/${artist.id}`} className="mini-artist-card">
                    <div className="artist-image">
                      {artist.images[0] && (
                        <img src={artist.images[0].url} alt={artist.name} />
                      )}
                    </div>
                    <span className="artist-name">{artist.name}</span>
                  </Link>
                ))}
              </div>
              {followedArtists.length > 12 && (
                <p className="show-more">
                  And {followedArtists.length - 12} more artists...
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};