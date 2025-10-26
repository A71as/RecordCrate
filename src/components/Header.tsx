import axios from "axios";
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
        if (isAuthenticated && user) {
          const accessToken = await memoizedGetAccessTokenSilently();
          const response = await axios.get(`http://localhost:8000/api/check-user/${user.sub}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
          });
          if (response.status == 204) {
            const createResponse = await axios.post(`http://localhost:8000/api/new-user`, {
              user_id: user.sub,
              email: user.email,
              name: user.name,
              username: user.nickname,
              picture: user.picture
            }, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
            });
            if (createResponse.status == 500)
              console.error("Failed to create user in database");
          } else if (response.status == 500)
            console.error("Failed to check user in database");
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

  const handleLogin = async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
        connection: "spotify",
      },
      appState: { returnTo: '/' }
    })
  };

  const handleLogout = () => {
    logout({
      logoutParams: { returnTo: window.location.origin } 
    });
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

          {isAuthenticated ? (
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