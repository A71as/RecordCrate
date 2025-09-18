import React from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Music } from 'lucide-react';

export const Header: React.FC = () => {
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
        </nav>
      </div>
    </header>
  );
};