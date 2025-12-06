import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Moon, Sun, MessageSquare, Menu, X, Disc3 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from '../context/ThemeContext';
import '../styles/components/Header.css';

export const Header: React.FC = () => {
  const { loginWithRedirect, logout: auth0Logout, user, isAuthenticated } = useAuth0();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchNavClick = () => {
    navigate('/search', { state: { resetSearch: Date.now() } });
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogin = async () => {
    await loginWithRedirect();
  };

  const handleLogout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const displayName = user?.name ?? user?.email ?? 'Guest';
  const avatarUrl = user?.picture;
  
  // Generate a default avatar with user's initials
  const getDefaultAvatar = () => {
    if (!displayName || displayName === 'Guest') return null;
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // Create a data URL for an SVG avatar with initials
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#c8955f"/>
        <text x="20" y="20" text-anchor="middle" dy="0.35em" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#ffffff">${initials}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const displayAvatar = avatarUrl || getDefaultAvatar();

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={closeMobileMenu}>
          <div className="logo-icon">
            <Disc3 size={28} strokeWidth={2.5} />
          </div>
          <span className="logo-text">RecordCrate</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/discover" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Discover
          </NavLink>
          <NavLink 
            to="/trending" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Charts
          </NavLink>
          <NavLink 
            to="/reviews" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={16} />
            <span>Reviews</span>
          </NavLink>
          <button 
            type="button" 
            className="nav-item nav-item-button" 
            onClick={handleSearchNavClick}
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <User size={16} />
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {/* Theme Toggle */}
          <button 
            type="button" 
            className="action-btn theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* User Section */}
          {isAuthenticated ? (
            <>
              <div className="user-badge">
                {displayAvatar && (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="user-avatar"
                    loading="lazy"
                  />
                )}
                <span className="user-name">{displayName}</span>
              </div>
              <button className="action-btn logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </>
          ) : (
            <button
              className="action-btn login-btn"
              onClick={handleLogin}
            >
              <User size={16} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            type="button" 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/discover" 
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Discover
            </NavLink>
            <NavLink 
              to="/trending" 
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Charts
            </NavLink>
            <NavLink 
              to="/reviews" 
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <MessageSquare size={18} />
              <span>Reviews</span>
            </NavLink>
            <button 
              type="button" 
              className="mobile-nav-item" 
              onClick={handleSearchNavClick}
            >
              <Search size={18} />
              <span>Search</span>
            </button>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <User size={18} />
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};