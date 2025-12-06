import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

export const Auth0Callback = () => {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (error) {
        logger.error('Auth0 callback error:', error);
        navigate('/?error=auth_failed');
      } else if (isAuthenticated) {
        navigate('/profile');
      } else {
        navigate('/');
      }
    }
  }, [isLoading, error, isAuthenticated, navigate]);

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