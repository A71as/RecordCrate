import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { spotifyService } from '../services/spotify';
import { useAuth } from '../context/useAuth';

export const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshSpotifyUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setError(`Spotify authentication failed: ${error}`);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received from Spotify');
        setLoading(false);
        return;
      }

      try {
        await spotifyService.exchangeCodeForToken(code);
        await refreshSpotifyUser();
        navigate('/profile', { replace: true });
      } catch (err) {
        console.error('Token exchange failed:', err);
        setError('Failed to authenticate with Spotify. Please try again.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [location.search, navigate, refreshSpotifyUser]);

  if (loading) {
    return (
      <div className="spotify-callback">
        <div className="container">
          <div className="callback-content">
            <div className="loading">
              <h2>Connecting to Spotify...</h2>
              <p>Please wait while we set up your account.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotify-callback">
        <div className="container">
          <div className="callback-content">
            <div className="error">
              <h2>Authentication Failed</h2>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => navigate('/', { replace: true })}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
