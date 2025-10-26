import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const SpotifyCallback: React.FC = () => {
  const { isLoading, error, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) navigate('/', { replace: true });
      else if (error) navigate('/', { state: { message: 'Login failed.' } });
    }
  }, [isLoading, error, user, navigate]);

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