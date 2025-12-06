import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthProvider';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { TrendingCharts } from './pages/TrendingCharts';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { Reviews } from './pages/Reviews';
import { AlbumDetail } from './pages/AlbumDetail';
import { ArtistDetail } from './pages/ArtistDetail';
import { SpotifyCallback } from './pages/SpotifyCallback';
import { Auth0Callback } from './pages/Auth0Callback';
import './styles/global.css';
import './styles/index.css';
import './App.css';

// Auth0 configuration
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

function App() {
  // Check if Auth0 is properly configured
  if (!domain || !clientId) {
    console.warn('Auth0 not configured. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env.local');
    
    // Render app without Auth0 if not configured
    return (
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Auth0 Configuration Required</h2>
                <p>Please configure Auth0 credentials in .env.local file</p>
                <p>See console for details</p>
              </div>
            </main>
          </div>
        </Router>
      </AuthProvider>
    );
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/auth/callback`,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/trending" element={<TrendingCharts />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/album/:albumId" element={<AlbumDetail />} />
                <Route path="/artist/:id" element={<ArtistDetail />} />
                <Route path="/callback" element={<SpotifyCallback />} />
                <Route path="/auth/callback" element={<Auth0Callback />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;
