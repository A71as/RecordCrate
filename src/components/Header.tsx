import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Music, LogOut } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import type { SpotifyUser } from '../types';

export const Header: React.FC = () => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuthStatus = async () => {
    const loginStatus = spotifyService.isLoggedIn();
    setIsLoggedIn(loginStatus);
    
    if (loginStatus) {
      // Only fetch user data if we're logged in
      try {
        const currentUser = await spotifyService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // If user fetch fails, still keep logged in status but clear user
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Initial synchronous check to prevent flash
  const initAuthCheck = () => {
    const loginStatus = spotifyService.isLoggedIn();
    setIsLoggedIn(loginStatus);
    
    if (!loginStatus) {
      setUser(null);
    }
    // If logged in, user data will be fetched async
  };

  useEffect(() => {
    // Do initial sync check first
    initAuthCheck();
    
    // Then do full async check
    checkAuthStatus();

    // Listen for storage changes (when tokens are added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spotify_access_token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically for same-tab changes
    const interval = setInterval(checkAuthStatus, 5000); // Reduced frequency

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = spotifyService.getAuthUrl();
  };

  const handleLogout = () => {
    spotifyService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <Music size={24} />
          <span>RecordCrate</span>
        </Link>

        <nav className="nav">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/search" className="nav-link">
            <Search size={18} />
            Search
          </Link>
          <Link to="/profile" className="nav-link">
            <User size={18} />
            Profile
          </Link>
          
          {isLoggedIn === null ? (
            // Show minimal loading state while checking auth status
            <div className="auth-loading" style={{ width: '140px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid var(--muted)', borderTop: '2px solid var(--rc-green-2)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : isLoggedIn ? (
            <div className="user-section">
              {user && (
                <div className="user-info">
                  {user.images && user.images[0] && (
                    <img 
                      src={user.images[0].url} 
                      alt={user.display_name}
                      className="user-avatar" 
                    />
                  )}
                  <span className="user-name">{user.display_name}</span>
                </div>
              )}
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button className="spotify-login-btn" onClick={handleLogin}>
              <Music size={16} />
              Login with Spotify
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};