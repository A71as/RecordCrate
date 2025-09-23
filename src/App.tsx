import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { AlbumDetail } from './pages/AlbumDetail';
import { SpotifyCallback } from './pages/SpotifyCallback';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/album/:albumId" element={<AlbumDetail />} />
            <Route path="/callback" element={<SpotifyCallback />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;