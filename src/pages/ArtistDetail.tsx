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
    const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
    const [eps, setEps] = useState<SpotifyAlbum[]>([]);
    const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
    const [currentTrackPage, setCurrentTrackPage] = useState(1);
    const [localLoading, setLocalLoading] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);

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

                // Categorize and sort albums chronologically (newest first)
                const sortedAlbums = albumsData.sort((a, b) =>
                    new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );

                const albumsOnly = sortedAlbums.filter(album =>
                    album.album_type === 'album'
                );

                const epsAndSingles = sortedAlbums.filter(album =>
                    album.album_type === 'single' || album.album_type === 'ep'
                );

                setArtist(artistData);
                setAlbums(albumsOnly);
                setEps(epsAndSingles);
                setTopTracks(tracksData);

            } catch (err) {
                setLocalError('Failed to load artist information');
                console.error('Error fetching artist data:', err);
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
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-message">Loading artist information...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (localError || !artist) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="error-message">
                        {localError || 'Artist not found'}
                    </div>
                    <button
                        onClick={() => navigate('/search')}
                        className="search-button back-button"
                    >
                        Back to Search
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
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
                
                <div className="artist-detail">
                    {/* Artist Header */}
                    <div className="artist-header">
                        <div className="artist-image-container">
                            {artist.images?.[0] ? (
                                <img
                                    src={artist.images[0].url}
                                    alt={artist.name}
                                    className="artist-image"
                                />
                            ) : (
                                <div className="artist-image-placeholder">
                                    👤
                                </div>
                            )}
                        </div>
                        <div className="artist-info">
                            <h1 className="artist-name">{artist.name}</h1>
                            <div className="artist-stats">
                                <span className="followers">
                                    {artist.followers?.total.toLocaleString()} followers
                                </span>
                                {artist.genres && artist.genres.length > 0 && (
                                    <div className="genres">
                                        {artist.genres.slice(0, 3).map((genre, index) => (
                                            <span key={index} className="genre-tag">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <a
                                href={artist.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="spotify-link"
                            >
                                Open in Spotify
                            </a>
                        </div>
                    </div>

                    {/* Popular Tracks with Pagination */}
                    {topTracks.length > 0 && (
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
                                        <span className="track-duration">
                                            {formatDuration(track.duration_ms)}
                                        </span>
                                        {track.preview_url && (
                                            <button
                                                className="preview-button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    const audio = new Audio(track.preview_url!);
                                                    audio.play().catch(console.error);
                                                }}
                                                title="Play preview"
                                            >
                                                ▶️
                                            </button>
                                        )}
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
                    )}

                    {/* Albums Section */}
                    {albums.length > 0 && (
                        <section className="artist-section">
                            <h2 className="section-title">Albums</h2>
                            <div className="albums-grid">
                                {albums.map((album) => (
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
                                            />
                                        ) : (
                                            <div className="album-image-placeholder">
                                                ♪
                                            </div>
                                        )}
                                        <div className="album-info">
                                            <h3 className="album-name">{album.name}</h3>
                                            <p className="album-year">
                                                {new Date(album.release_date).getFullYear()}
                                            </p>
                                            <p className="album-type">
                                                {album.total_tracks} tracks
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* EPs and Singles Section */}
                    {eps.length > 0 && (
                        <section className="artist-section">
                            <h2 className="section-title">EPs & Singles</h2>
                            <div className="albums-grid">
                                {eps.map((ep) => (
                                    <div
                                        key={ep.id}
                                        className="album-card"
                                        onClick={() => handleAlbumClick(ep.id)}
                                    >
                                        {ep.images?.[0] ? (
                                            <img
                                                src={ep.images[0].url}
                                                alt={ep.name}
                                                className="album-image"
                                            />
                                        ) : (
                                            <div className="album-image-placeholder">
                                                ♪
                                            </div>
                                        )}
                                        <div className="album-info">
                                            <h3 className="album-name">{ep.name}</h3>
                                            <p className="album-year">
                                                {new Date(ep.release_date).getFullYear()}
                                            </p>
                                            <p className="album-type">
                                                {ep.album_type} • {ep.total_tracks} tracks
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};
