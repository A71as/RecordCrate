import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Music, LogOut, PlugZap } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const Header: React.FC = () => {
  const {
    googleUser,
    spotifyUser,
    isGoogleLoggedIn,
    isSpotifyLinked,
    loadingSpotify,
    linkSpotifyAccount,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const handleSearchNavClick = () => {
    navigate('/search', { state: { resetSearch: Date.now() } });
  };

  const displayName = spotifyUser?.display_name ?? googleUser?.name ?? 'Guest';
  const avatarUrl = spotifyUser?.images?.[0]?.url ?? googleUser?.picture;

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <Music size={24} />
          <span>RecordCrate</span>
        </Link>

        <nav className="nav">
          <Link to="/discography" className="nav-link">
            Discography
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <button type="button" className="nav-link" onClick={handleSearchNavClick}>
            <Search size={18} />
            Search
          </button>
          <Link to="/profile" className="nav-link">
            <User size={18} />
            Profile
          </Link>
          
          {isGoogleLoggedIn ? (
            <div className="user-section">
              <div className="user-info">
                {avatarUrl && (
                  <img 
                    src={avatarUrl} 
                    alt={displayName}
                    className="user-avatar" 
                  />
                )}
                <span className="user-name">{displayName}</span>
              </div>
              {!isSpotifyLinked ? (
                <button
                  className="spotify-login-btn"
                  onClick={linkSpotifyAccount}
                  disabled={loadingSpotify}
                >
                  <PlugZap size={16} />
                  {loadingSpotify ? 'Linking...' : 'Link Spotify'}
                </button>
              ) : (
                <button className="logout-btn" onClick={logout}>
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </div>
          ) : (
            <button
              className="spotify-login-btn"
              onClick={linkSpotifyAccount}
              disabled={loadingSpotify}
            >
              <Music size={16} />
              Login with Spotify
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};