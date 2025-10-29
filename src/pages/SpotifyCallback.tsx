import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { spotifyService } from '../services/spotify';

export const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; suggestion: string } | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Prevent duplicate processing in React StrictMode
    if (processed) return;

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        // Create user-friendly error messages
        let friendlyMessage = "We couldn't connect to your Spotify account.";
        let suggestion = "This usually happens when you cancel the login process.";
        
        if (error === 'access_denied') {
          friendlyMessage = "Spotify connection was cancelled";
          suggestion = "No worries! You can try connecting again anytime.";
        } else if (error === 'invalid_request') {
          friendlyMessage = "There was a problem with the connection";
          suggestion = "Please try logging in again.";
        } else if (error === 'server_error') {
          friendlyMessage = "Spotify is having some issues right now";
          suggestion = "Please wait a moment and try again.";
        }
        
        setError({ message: friendlyMessage, suggestion });
        setLoading(false);
        return;
      }

      if (!code) {
        setError({ 
          message: "Something went wrong during login", 
          suggestion: "Please try connecting to Spotify again." 
        });
        setLoading(false);
        return;
      }

      // Mark as processed to prevent duplicate attempts
      setProcessed(true);

      try {
        await spotifyService.exchangeCodeForToken(code);
        
        // Test the token immediately
        await spotifyService.validateToken();
        
        // Force a small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the intended redirect path or fallback to profile
        const redirectPath = localStorage.getItem('spotify_redirect_after_login') || '/profile';
        
        // Clean up the stored redirect path
        localStorage.removeItem('spotify_redirect_after_login');
        
        // Use window.location for a full page reload to ensure state is updated
        window.location.href = redirectPath;
      } catch (err) {
        console.error('Token exchange failed:', err);
        setError({ 
          message: "We couldn't connect to your Spotify account", 
          suggestion: "Please try again in a moment." 
        });
        setLoading(false);
        setProcessed(false); // Allow retry on failure
      }
    };

    handleCallback();
  }, [location.search, navigate, processed]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="spotify-callback">
        <div className="error-friendly">
          <h2>{error.message}</h2>
          <p className="error-suggestion">{error.suggestion}</p>
          <div className="error-actions">
            <button 
              className="spotify-login-btn primary"
              onClick={() => {
                // Store profile as default redirect for retry
                localStorage.setItem('spotify_redirect_after_login', '/profile');
                window.location.href = spotifyService.getAuthUrl();
              }}
            >
              Try Again
            </button>
            <button 
              className="secondary-button"
              onClick={() => navigate('/', { replace: true })}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};