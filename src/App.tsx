import { Auth0Provider } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { AlbumDetail } from './pages/AlbumDetail';
import { ArtistDetail } from './pages/ArtistDetail';
import { SpotifyCallback } from './pages/SpotifyCallback';
import './styles/global.css';
import './styles/index.css';
import './App.css';


function App() {
  const env = import.meta.env;
  const domain = env.VITE_AUTH0_DOMAIN;
  const clientId = env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = env.VITE_AUTH0_REDIRECT_URI;
  const audience = env.VITE_AUTH0_AUDIENCE;
  console.log(env);
  return (
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience,
      }}
    >
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/album/:albumId" element={<AlbumDetail />} />
              <Route path="/artist/:id" element={<ArtistDetail />} />
              <Route path="/callback" element={<SpotifyCallback />} />
            </Routes>
          </main>
        </div>
      </Router >
    </Auth0Provider>
  );
}

export default App;