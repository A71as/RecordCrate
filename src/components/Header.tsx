import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Music, LogOut } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import type { SpotifyUser } from '../types';

export const Header: React.FC = () => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoggedIn(spotifyService.isLoggedIn());
      if (spotifyService.isLoggedIn()) {
        const currentUser = await spotifyService.getCurrentUser();
        setUser(currentUser);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    window.location.href = spotifyService.getAuthUrl();
  };

  const handleLogout = () => {
    spotifyService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleSearchNavClick = () => {
    navigate('/search', { state: { resetSearch: Date.now() } });
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
          <button type="button" className="nav-link" onClick={handleSearchNavClick}>
            <Search size={18} />
            Search
          </button>
          <Link to="/profile" className="nav-link">
            <User size={18} />
            Profile
          </Link>
          
          {isLoggedIn ? (
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
