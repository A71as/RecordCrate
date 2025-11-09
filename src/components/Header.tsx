import axios from "axios";
import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Music, LogOut } from 'lucide-react';
import { useAuth0 } from "@auth0/auth0-react";

export const Header: React.FC = () => {
  const { user, isAuthenticated, getAccessTokenSilently, loginWithRedirect, isLoading, logout } = useAuth0();

  const memoizedGetAccessTokenSilently = useCallback(
    () => getAccessTokenSilently(),
    [getAccessTokenSilently]
  );

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (user && !user.created_at) {
          const accessToken = await memoizedGetAccessTokenSilently();
          await axios.post(`http://localhost:8000/api/new-user`, {
            user_id: user.sub,
            email: user.email,
            name: user.name,
            username: user.nickname,
            picture: user.picture
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          });
        }
      } catch (error) {
        console.error("Error during user check:", error);
      }
    };

    if (isAuthenticated && !isLoading) {
      checkUser();
    }
  }, [
    isAuthenticated,
    memoizedGetAccessTokenSilently,
    user,
    isLoading,
  ]);

  // Google Login
  const handleLogin = async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
        connection: "google-oauth2",
      },
      appState: { returnTo: '/' }
    });
  };

  const navigate = useNavigate();

  const handleSearchNavClick = () => {
    navigate('/search', { state: { resetSearch: Date.now() } });
  };

  const displayName = user?.given_name ?? 'Guest';
  const avatarUrl = user?.picture;

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
              <button className="logout-btn" onClick={() => logout()}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button
              className="spotify-login-btn"
              onClick={handleLogin}
            >
              <Music size={16} />
              Login to RecordCrate
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};