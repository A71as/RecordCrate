import React from 'react';
import type { SpotifyTrack } from '../types';
import '../styles/components/TrackSearchResults.css';

interface TrackSearchResultsProps {
    tracks: SpotifyTrack[];
}

export const TrackSearchResults: React.FC<TrackSearchResultsProps> = ({ tracks }) => {
    if (tracks.length === 0) {
        return null;
    }

    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="search-results-section">
            <h2 className="results-section-title">Tracks</h2>
            <div className="track-results-grid">
                {tracks.map((track) => (
                    <div key={track.id} className="track-result-item">
                        <div className="track-icon">
                            🎵
                        </div>
                        <div className="track-info">
                            <h3 className="track-name">{track.name}</h3>
                            <p className="track-artist">
                                {track.artists.map(artist => artist.name).join(', ')}
                            </p>
                            <div className="track-details">
                                <span className="track-duration">
                                    {formatDuration(track.duration_ms)}
                                </span>
                                {track.explicit && (
                                    <span className="explicit-tag">E</span>
                                )}
                                {track.preview_url && (
                                    <button
                                        className="preview-button"
                                        onClick={() => {
                                            const audio = new Audio(track.preview_url!);
                                            audio.play().catch(console.error);
                                        }}
                                        title="Play preview"
                                    >
                                        ▶️
                                    </button>
                                )}
                            </div>
                        </div>
                        <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="spotify-link"
                            title="Open in Spotify"
                        >
                            Open in Spotify
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};