import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SpotifyTrack } from '../types';
import '../styles/components/BillboardTrackList.css';

interface BillboardTrack {
  rank: number;
  title: string;
  artist: string;
  isSpotifyMatched?: boolean;
  billboardRank?: number;
}

interface BillboardTrackListProps {
  tracks: (SpotifyTrack | BillboardTrack)[];
  loading: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  total: number;
}

export const BillboardTrackList: React.FC<BillboardTrackListProps> = ({
  tracks,
  loading,
  hasMore,
  loadMoreRef,
  total,
}) => {
  const navigate = useNavigate();

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSpotifyTrack = (track: SpotifyTrack | BillboardTrack): track is SpotifyTrack => {
    return 'id' in track && 'album' in track && (track as any).isSpotifyMatched !== false;
  };

  const handleTrackClick = (track: SpotifyTrack | BillboardTrack) => {
    // Only navigate if it's a Spotify-matched track
    if (isSpotifyTrack(track) && track.album?.id) {
      navigate(`/album/${track.album.id}`);
    }
  };

  return (
    <div className="billboard-track-list">
      <div className="billboard-header">
        <h2>Billboard Hot 100</h2>
        <p className="track-count">
          Showing {tracks.length} of {total} tracks
        </p>
      </div>

      <div className="tracks-container">
        {tracks.map((track, index) => {
          const isMatched = isSpotifyTrack(track);
          const rank = (track as any).billboardRank || (track as BillboardTrack).rank || index + 1;
          
          // For Billboard-only tracks
          if (!isMatched) {
            const billboardTrack = track as BillboardTrack;
            return (
              <div 
                key={`billboard-${rank}-${index}`} 
                className="billboard-track-item placeholder"
                title="Not available on Spotify"
              >
                <div className="track-rank">
                  #{rank}
                </div>
                
                <div className="track-image">
                  <div className="track-image-placeholder">
                    <span>♪</span>
                  </div>
                </div>

                <div className="track-info">
                  <div className="track-name">{billboardTrack.title}</div>
                  <div className="track-artist">{billboardTrack.artist}</div>
                </div>

                <div className="track-album not-available">
                  Not on Spotify
                </div>

                <div className="track-duration">
                  —
                </div>

                <div className="not-available-badge" title="Not available on Spotify">
                  N/A
                </div>

                <div className="spotify-link-icon disabled">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.3">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
              </div>
            );
          }

          // For Spotify-matched tracks
          const spotifyTrack = track as SpotifyTrack;
          return (
            <div 
              key={`${spotifyTrack.id}-${index}`} 
              className="billboard-track-item"
              onClick={() => handleTrackClick(spotifyTrack)}
              style={{ cursor: 'pointer' }}
            >
              <div className="track-rank">
                #{rank}
              </div>
              
              <div className="track-image">
                {spotifyTrack.album?.images?.[0]?.url ? (
                  <img src={spotifyTrack.album.images[0].url} alt={spotifyTrack.name} />
                ) : (
                  <div className="track-image-placeholder">
                    <span>♪</span>
                  </div>
                )}
              </div>

              <div className="track-info">
                <div className="track-name">{spotifyTrack.name}</div>
                <div className="track-artist">
                  {spotifyTrack.artists.map((artist) => artist.name).join(', ')}
                </div>
              </div>

              <div className="track-album">
                {spotifyTrack.album?.name || 'Unknown Album'}
              </div>

              <div className="track-duration">
                {formatDuration(spotifyTrack.duration_ms)}
              </div>

              {spotifyTrack.explicit && (
                <div className="explicit-badge">E</div>
              )}

              <a
                href={spotifyTrack.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="spotify-link-icon"
                aria-label="Open in Spotify"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="loading-more">
          <div className="spinner"></div>
          <p>Loading more tracks...</p>
        </div>
      )}

      {!loading && hasMore && <div ref={loadMoreRef} className="load-sentinel" />}

      {!loading && !hasMore && tracks.length > 0 && (
        <div className="all-loaded">
          <p>🎉 You've reached the end of the Billboard Hot 100!</p>
        </div>
      )}
    </div>
  );
};
