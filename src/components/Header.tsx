import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, User, Music, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

export const Header: React.FC = () => {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const navigate = useNavigate();

  const handleSearchNavClick = () => {
    navigate('/search', { state: { resetSearch: Date.now() } });
  };

  const displayName = user?.name ?? user?.email ?? 'Guest';
  const avatarUrl = user?.picture;

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <Music size={24} />
          <span>RecordCrate</span>
        </Link>

        <nav className="nav">
          <NavLink to="/discover" className="nav-link">
            Discover
          </NavLink>
          <NavLink to="/discography" className="nav-link">
            Discography
          </NavLink>
          <button type="button" className="nav-link nav-link-button" onClick={handleSearchNavClick}>
            <Search size={18} />
            Search
          </button>
          <NavLink to="/profile" className="nav-link">
            <User size={18} />
            Profile
          </NavLink>
          <div className="nav-divider"></div>
          {isAuthenticated ? (
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
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button
              className="auth-login-btn"
              onClick={handleLogin}
            >
              <User size={16} />
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};