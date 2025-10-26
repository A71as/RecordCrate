import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Music, LogOut } from 'lucide-react';
import { spotifyService } from '../services/spotify';
import type { SpotifyUser } from '../types';
import { useAuth0 } from "@auth0/auth0-react";

export const Header: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const handleLogin = async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: "http://localhost:5173/callback",
        connection: "spotify",
      },
      appState: { returnTo: '/' }
    })
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