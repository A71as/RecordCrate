import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { lazy, Suspense } from 'react';
import { logger } from './utils/logger';
import { Header } from './components/Header';
import { AuthProvider } from './context/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';
import './styles/index.css';
import './App.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Discover = lazy(() => import('./pages/Discover'));
const TrendingCharts = lazy(() => import('./pages/TrendingCharts'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Reviews = lazy(() => import('./pages/Reviews'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const ArtistDetail = lazy(() => import('./pages/ArtistDetail'));
const SpotifyCallback = lazy(() => import('./pages/SpotifyCallback'));
const Auth0Callback = lazy(() => import('./pages/Auth0Callback'));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - var(--header-height))',
    fontSize: '1.2rem',
    color: 'var(--muted)'
  }}>
    Loading...
  </div>
);

// Auth0 configuration
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

function App() {
  // Check if Auth0 is properly configured
  if (!domain || !clientId) {
    logger.warn('Auth0 not configured. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env.local');
    
    // Render app without Auth0 if not configured
    return (
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <ErrorBoundary>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Auth0 Configuration Required</h2>
                  <p>Please configure Auth0 credentials in .env.local file</p>
                  <p>See console for details</p>
                </div>
              </ErrorBoundary>
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
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;
