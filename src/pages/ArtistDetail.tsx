import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import type { SpotifyArtist, SpotifyAlbum, SpotifyTrack } from '../types';
import '../styles/pages/ArtistDetail.css';

export const ArtistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [artist, setArtist] = useState<SpotifyArtist | null>(null);
    const [discography, setDiscography] = useState<SpotifyAlbum[]>([]);
    const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
    const [currentTrackPage, setCurrentTrackPage] = useState(1);
    const [localLoading, setLocalLoading] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    const tracksPerPage = 10;

    useEffect(() => {
        const fetchArtistData = async () => {
            if (!id) return;

            setLocalLoading(true);
            setLocalError(null);

            try {
                const [artistData, albumsData, tracksData] = await Promise.all([
                    spotifyService.getArtist(id),
                    spotifyService.getArtistAlbums(id),
                    spotifyService.getArtistTopTracks(id)
                ]);
                // Sort entire discography chronologically (newest first)
                const sortedAlbums = albumsData.sort((a, b) =>
                    new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );
                setArtist(artistData);
                setDiscography(sortedAlbums);
                setTopTracks(tracksData);

            } catch (err) {
                setLocalError('Failed to load artist information');
                logger.error('Error fetching artist data:', err);
            } finally {
                setLocalLoading(false);
            }
        };

        fetchArtistData();
    }, [id]);

    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatAlbumType = (type?: string): string => {
        if (!type) return 'Album';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const formatFollowers = (count: number): string => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const handleTrackPreview = (trackId: string, previewUrl: string, event: React.MouseEvent) => {
        event.stopPropagation();
        
        if (currentAudio) {
            currentAudio.pause();
            if (playingTrackId === trackId) {
                setPlayingTrackId(null);
                setCurrentAudio(null);
                return;
            }
        }
        
        const audio = new Audio(previewUrl);
        audio.addEventListener('ended', () => {
            setPlayingTrackId(null);
            setCurrentAudio(null);
        });
        
        audio.play().catch(logger.error);
        setPlayingTrackId(trackId);
        setCurrentAudio(audio);
    };

    const handleAlbumClick = (albumId: string) => {
        navigate(`/album/${albumId}`);
    };

    const handleTrackClick = (track: SpotifyTrack) => {
        const albumId = track.album?.id;
        if (albumId) {
            navigate(`/album/${albumId}`);
        }
    };

    const handleTrackKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        track: SpotifyTrack
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTrackClick(track);
        }
    };

    // Pagination helpers for tracks
    const totalTrackPages = Math.ceil(topTracks.length / tracksPerPage);
    const startIndex = (currentTrackPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = topTracks.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentTrackPage < totalTrackPages) {
            setCurrentTrackPage(currentTrackPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentTrackPage > 1) {
            setCurrentTrackPage(currentTrackPage - 1);
        }
    };

    if (localLoading) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="artist-detail">
                        <div className="artist-hero">
                            <div className="skeleton" style={{ width: 'clamp(180px, 25vw, 240px)', height: 'clamp(180px, 25vw, 240px)', borderRadius: '50%', margin: '0 auto 2rem' }} />
                            <div className="skeleton skeleton-heading" style={{ width: '60%', height: '3rem', margin: '0 auto 1rem' }} />
                            <div className="skeleton skeleton-text" style={{ width: '30%', height: '1.5rem', margin: '0 auto 2rem' }} />
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '50px' }} />
                                <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '50px' }} />
                                <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '50px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '200px', height: '48px', borderRadius: '50px', margin: '0 auto' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (localError || !artist) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span style={{ fontSize: '3rem' }}>🎵</span>
                        </div>
                        <h3>{localError || 'Artist not found'}</h3>
                        <p>We couldn't load this artist's information. This might be a temporary issue.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                            >
                                🔄 Retry
                            </button>
                            <button
                                onClick={() => navigate('/search')}
                                className="btn btn-secondary"
                            >
                                Back to Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="container">
                <button className="btn btn-ghost" style={{ marginBottom: '2rem' }} onClick={() => {
                    if (window.history.length > 1) {
                        navigate(-1);
                    } else {
                        navigate('/');
                    }
                }}>
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div className="artist-detail">
                    {/* Artist Hero */}
                    <div className="artist-hero">
                        <div className="artist-image-wrapper">
                            {artist.images?.[0] ? (
                                <img
                                    src={artist.images[0].url}
                                    alt={artist.name}
                                    className="artist-image"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="artist-image-placeholder">
                                    👤
                                </div>
                            )}
                        </div>
                        <h1 className="artist-name">{artist.name}</h1>
                        <div className="artist-stats">
                            <span className="followers" title={`${artist.followers?.total.toLocaleString()} followers`}>
                                {formatFollowers(artist.followers?.total || 0)} followers
                            </span>
                        </div>
                        {artist.genres && artist.genres.length > 0 && (
                            <div className="genres">
                                {artist.genres.slice(0, 5).map((genre, index) => (
                                    <span key={index} className="genre-tag">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                        <a
                            href={artist.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="spotify-link"
                        >
                            Open in Spotify
                        </a>
                    </div>

                    {/* Popular Tracks */}
                    {topTracks.length > 0 ? (
                        <section className="artist-section">
                            <div className="section-header">
                                <h2 className="section-title">Popular Tracks</h2>
                                {totalTrackPages > 1 && (
                                    <div className="pagination-info">
                                        Page {currentTrackPage} of {totalTrackPages}
                                    </div>
                                )}
                            </div>
                            <div className="tracks-list">
                                {currentTracks.map((track, index) => (
                                    <div
                                        key={track.id}
                                        className="track-item"
                                        role={track.album?.id ? 'button' : undefined}
                                        tabIndex={track.album?.id ? 0 : -1}
                                        onClick={() => track.album?.id && handleTrackClick(track)}
                                        onKeyDown={(event) =>
                                            track.album?.id && handleTrackKeyDown(event, track)
                                        }
                                        aria-label={
                                            track.album?.id
                                                ? `Open album ${track.album?.name}`
                                                : undefined
                                        }
                                    >
                                        <span className="track-number">
                                            {startIndex + index + 1}
                                        </span>
                                        <div className="track-details">
                                            <h3 className="track-name">{track.name}</h3>
                                            <p className="track-album">{track.album?.name}</p>
                                        </div>
                                        <div className="track-right">
                                            <span className="track-duration">
                                                {formatDuration(track.duration_ms)}
                                            </span>
                                            {track.preview_url && (
                                                <button
                                                    className={`preview-button ${playingTrackId === track.id ? 'playing' : ''}`}
                                                    onClick={(event) => handleTrackPreview(track.id, track.preview_url!, event)}
                                                    title={playingTrackId === track.id ? 'Pause preview' : 'Play preview'}
                                                    aria-label={playingTrackId === track.id ? 'Pause preview' : 'Play preview'}
                                                >
                                                    {playingTrackId === track.id ? '⏸️' : '▶️'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {totalTrackPages > 1 && (
                                <div className="pagination-controls">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentTrackPage === 1}
                                        className="pagination-button"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="pagination-current">
                                        {currentTrackPage} / {totalTrackPages}
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentTrackPage === totalTrackPages}
                                        className="pagination-button"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="artist-section">
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <h3>No Popular Tracks Available</h3>
                                <p>We couldn't find popular tracks for this artist at the moment.</p>
                            </div>
                        </section>
                    )}

                    {/* Complete Discography */}
                    {discography.length > 0 ? (
                        <section className="artist-section">
                            <h2 className="section-title">Discography</h2>
                            <div className="albums-grid">
                                {discography.map((album) => (
                                    <div
                                        key={album.id}
                                        className="album-card"
                                        onClick={() => handleAlbumClick(album.id)}
                                    >
                                        {album.images?.[0] ? (
                                            <img
                                                src={album.images[0].url}
                                                alt={album.name}
                                                className="album-image"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="album-image-placeholder">
                                                No Art
                                            </div>
                                        )}
                                        <div className="album-info">
                                            <h3 className="album-name">{album.name}</h3>
                                            <div className="album-meta">
                                                {album.release_date && (
                                                    <span className="album-year">
                                                        {new Date(album.release_date).getFullYear()}
                                                    </span>
                                                )}
                                                <span className="album-type">
                                                    {formatAlbumType(album.album_type)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="artist-section">
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <h3>No Discography Available</h3>
                                <p>We couldn't find albums for this artist at the moment.</p>
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ArtistDetail;
