import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { backend } from '../services/backend';

export const Auth0Callback = () => {
  const { isLoading, error, isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      if (!isLoading) {
        if (error) {
          logger.error('Auth0 callback error:', error);
          navigate('/?error=auth_failed');
        } else if (isAuthenticated && user) {
          try {
            // Sync user to backend database
            await backend.syncUser({
              spotifyId: user.sub || '',
              displayName: user.name || user.email || 'Unknown',
              avatarUrl: user.picture || undefined
            });
            logger.info('[Auth0Callback] User synced successfully');
          } catch (syncError) {
            logger.error('[Auth0Callback] Failed to sync user:', syncError);
            // Continue navigation even if sync fails - upsert will handle it later
          }
          navigate('/profile');
        } else {
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [isLoading, error, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px'
      }}>
        <h2>Authentication Error</h2>
        <p>Something went wrong during authentication.</p>
        <button onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh',
      fontSize: '18px'
    }}>
      Redirecting...
    </div>
  );
};

export default Auth0Callback;