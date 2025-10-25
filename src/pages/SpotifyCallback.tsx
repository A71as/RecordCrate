import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const SpotifyCallback: React.FC = () => {
  const { handleRedirectCallback } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth0Callback = async () => {
      try {
        await handleRedirectCallback(); // Auth0 handles token exchange internally
        navigate('/profile', { replace: true });
      } catch (err) {
        console.error('Auth0 callback error:', err);
        navigate('/error', { state: { message: 'Login failed. Please try again.' } });
      }
    };

    handleAuth0Callback();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="auth-callback">
      <div className="container">
        <h2>Connecting your Spotify account...</h2>
        <p>Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
};

export default SpotifyCallback;