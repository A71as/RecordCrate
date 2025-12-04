# 🎵 RecordCrate

<div align="center">

**The Modern Music Discovery & Review Platform**

A comprehensive music cataloging application built for collectors, audiophiles, and music enthusiasts. Discover albums, write detailed reviews, track your listening journey, and explore music with intelligent search powered by AI.

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19-47A248?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Demo](#-live-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**RecordCrate** is a full-stack music discovery and review platform that combines the power of Spotify's vast music catalog with sophisticated rating systems and social features. Whether you're a casual listener or a music critic, RecordCrate provides the tools to explore, rate, and share your musical journey.

### Why RecordCrate?

- **🎯 Precision Rating System**: Rate albums on a 0-100% scale with granular track ratings and score modifiers
- **🤖 AI-Powered Search**: Natural language queries like "sad indie albums from 2010s" using Google Gemini AI
- **📊 Activity Tracking**: Streak calendar to visualize your listening habits
- **🌐 No Login Required**: Browse and discover music without authentication
- **📱 Fully Responsive**: Beautiful UI optimized for desktop, tablet, and mobile
- **🎨 Elegant Design**: Vintage vinyl aesthetic with light/dark theme support
- **💾 Offline-First**: LocalStorage fallbacks ensure your reviews are never lost

---

## ✨ Features

### 🔍 **Discovery & Search**

#### **Discover Page**
- Curated content organized by popularity, genre, and release date
- Dynamic filtering system with multiple category support
- Explore new releases, popular albums, and hidden gems
- Real-time filtering without page reloads

#### **Discography Browser**
- Genre-based exploration with 20+ categories
- No authentication required - instant access
- Popularity metrics and release information
- Direct integration with Spotify catalog

#### **Advanced Search**
- **Standard Search**: Find albums, artists, and tracks instantly
- **Natural Language Search**: AI-powered queries using Google Gemini
  - Example: *"albums like Blonde by Frank Ocean"*
  - Example: *"upbeat jazz from the 1960s"*
  - Example: *"sad indie rock with female vocals"*
- Unified search results with type indicators
- Quick navigation to album detail pages

#### **Billboard Hot 100**
- Real-time chart data from Billboard
- Weekly updated rankings
- One-click access to trending music

---

### ⭐ **Rating & Review System**

#### **Dual Rating Scale**
- **Album Rating**: 0-100% precision slider
- **Track Rating**: 0-5 stars with half-star increments
- Color-coded visual feedback (red → yellow → green)
- Automatic base score calculation from track ratings

#### **Score Modifiers**
Fine-tune your album rating across four categories (±5% each):
1. **Emotional/Story Connection** - How the album resonates emotionally
2. **Cohesion & Flow** - Track sequencing and album unity
3. **Artist Identity & Originality** - Uniqueness and creative vision
4. **Visual/Aesthetic Ecosystem** - Album artwork and presentation

*Total modifier range: -20% to +20%*

#### **Review Writing**
- Rich text area for detailed thoughts (up to 350 words recommended)
- Automatic save to both MongoDB and localStorage
- Edit or delete reviews with confirmation dialogs
- Album metadata cached for faster loading

#### **Review Browsing**
- **Community Reviews Page**: Browse all public reviews
- Filter by:
  - 🔥 **Recent** - Latest reviews from the community
  - ⭐ **Top Rated** - Highest-scoring albums
  - 💬 **Most Discussed** - Albums with most reviews
- Direct links to album detail pages
- User attribution with timestamps

---

### 📊 **Personal Features**

#### **Streak Calendar**
- Visual heatmap of your daily rating activity
- Tracks consecutive days of album reviews
- Current streak and total days counted
- Motivational system for consistent engagement

#### **Profile Dashboard**
- View all your submitted reviews
- Quick navigation to reviewed albums
- User statistics and activity summary
- Google account integration with avatar display

#### **Theme System**
- **Light Mode**: Warm cream and wood tones
- **Dark Mode**: Deep blacks with amber accents
- Smooth transitions between themes
- Persistent preference storage
- System preference detection

---

### 🎨 **Design System**

#### **Color Palette**
RecordCrate features a vintage **vinyl + wooden crate aesthetic**:

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Vinyl Black** | `#1a1a1d` | Deep backgrounds, text |
| **Warm Wood** | `#8b6f47` | Crate-inspired accents |
| **Amber Gold** | `#d4a574` | Interactive elements, highlights |
| **Cream** | `#f4ece1` | Light backgrounds, soft text |
| **Terracotta Red** | `#c17d5a` | Low ratings, alerts |
| **Sage Green** | `#7ba66a` | High ratings, success states |

#### **Typography**
- **Font Family**: Inter, system-ui fallbacks
- **Headings**: 800-900 weight, tight letter spacing
- **Body**: 400-600 weight, optimized line height
- **Responsive**: `clamp()` functions for fluid scaling

#### **UI Components**
- **Cards**: Gradient backgrounds, layered shadows, rounded corners
- **Buttons**: Smooth hover effects, proper focus states
- **Inputs**: Themed borders, clear feedback
- **Navigation**: Fixed header with glassmorphism effect

---

## 🛠 Tech Stack

### **Frontend**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI component library |
| **TypeScript** | 5.8.3 | Type safety and developer experience |
| **Vite** | 7.1.2 | Build tool and dev server |
| **React Router** | 7.8.2 | Client-side routing |
| **Lucide React** | 0.542.0 | Icon system |
| **Axios** | 1.11.0 | HTTP client |

### **Backend**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | JavaScript runtime |
| **Express** | 5.1.0 | Web application framework |
| **MongoDB** | 8.19.1 | NoSQL database |
| **Mongoose** | 8.19.1 | MongoDB ODM |
| **CORS** | 2.8.5 | Cross-origin resource sharing |

### **External APIs**

- **Spotify Web API** - Music catalog, metadata, and search
- **Google Gemini AI** - Natural language processing for search
- **Billboard API** - Chart data integration
- **MongoDB Atlas** - Cloud database hosting (optional)

### **Development Tools**

- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting
- **Concurrently** - Run multiple npm scripts simultaneously
- **Nodemon** - Auto-reload for backend development
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library

---

## 🚀 Installation

### **Prerequisites**

Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **MongoDB** (optional - see [configuration](#mongodb-setup))

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/A71as/RecordCrate.git
   cd RecordCrate
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure environment variables**
   ```bash
   # Frontend configuration
   cp .env.example .env
   
   # Backend configuration
   cp server/.env.example server/.env
   ```
   
   Edit both `.env` files with your credentials (see [Configuration](#-configuration))

4. **Start development servers**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Frontend: `http://localhost:5175` (or next available port)
   - Backend: `http://localhost:4001`

5. **Open your browser**
   
   Navigate to `http://localhost:5175` and start exploring!

---

## ⚙️ Configuration

### **Environment Variables**

#### **Frontend** (`.env` in root directory)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4001

# Spotify OAuth (Optional - for user authentication)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5175/callback

# Google Gemini AI (Optional - for natural language search)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

#### **Backend** (`server/.env`)

```env
# Server Configuration
PORT=4001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175

# MongoDB (Optional - server runs in discography-only mode without it)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recordcrate?retryWrites=true&w=majority

# Spotify API (Required for full functionality)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google Gemini AI (Optional - for backend NLS processing)
GEMINI_API_KEY=your_gemini_api_key
```

### **Getting API Credentials**

#### **Spotify API**
1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in app details:
   - **App Name**: RecordCrate Local
   - **Redirect URI**: `http://localhost:5175/callback`
5. Copy **Client ID** and **Client Secret** to your `.env` files

#### **Google Gemini AI** (Optional)
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new API key
5. Copy to both `.env` files as `GEMINI_API_KEY`

#### **MongoDB Setup**

**Option 1: MongoDB Atlas (Cloud - Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Add database user in **Database Access**
4. Whitelist IP address `0.0.0.0/0` in **Network Access**
5. Click **Connect** → **Connect your application**
6. Copy connection string to `MONGODB_URI` in `server/.env`
7. Replace `<username>` and `<password>` with your database credentials

**Option 2: Local MongoDB**
```bash
# Install MongoDB Community Edition
# macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Use local connection string in server/.env:
MONGODB_URI=mongodb://localhost:27017/recordcrate
```

**Option 3: No Database**
- The server will run in **discography-only mode**
- Discography and search features work without MongoDB
- Review and user features require database connection

---

## 📂 Project Structure

```
RecordCrate/
│
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/              # Reusable React components
│   │   ├── AlbumCard.tsx          # Album display card with hover effects
│   │   ├── AlbumStreakCalendar.tsx # Activity streak visualization
│   │   ├── ArtistCard.tsx         # Artist display card
│   │   ├── FilterTabs.tsx         # Multi-category filter system
│   │   ├── Header.tsx             # Navigation header with mobile menu
│   │   ├── MusicFilterBar.tsx     # Discography genre filters
│   │   ├── ReviewForm.tsx         # Review creation/editing form
│   │   ├── SearchDropdown.tsx     # Search results dropdown
│   │   ├── SearchInput.tsx        # Search interface
│   │   └── StarRating.tsx         # 5-star rating component
│   │
│   ├── 📁 pages/                   # Route-based page components
│   │   ├── AboutUs.tsx            # About page content
│   │   ├── AlbumDetail.tsx        # Album details + review interface
│   │   ├── ArtistDetail.tsx       # Artist discography view
│   │   ├── Discography.tsx        # Genre-based music browsing
│   │   ├── Discover.tsx           # Curated discovery page
│   │   ├── Home.tsx               # Landing page
│   │   ├── Profile.tsx            # User profile dashboard
│   │   ├── Reviews.tsx            # Community reviews browser
│   │   ├── Search.tsx             # Search interface
│   │   └── SpotifyCallback.tsx    # OAuth callback handler
│   │
│   ├── 📁 services/                # External service integrations
│   │   ├── backend.ts             # Backend API client
│   │   └── spotify.ts             # Spotify Web API service
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── useAuth.ts             # Authentication state management
│   │   ├── useClickOutside.ts     # Click-outside detection
│   │   ├── useSearchCache.ts      # Search result caching
│   │   ├── useSearchLogic.ts      # Search state management
│   │   └── useSpotify.ts          # Spotify data fetching
│   │
│   ├── 📁 context/                 # React Context providers
│   │   ├── AuthContext.ts         # Auth context definition
│   │   ├── AuthProvider.tsx       # Auth provider component
│   │   ├── authConstants.ts       # Auth configuration
│   │   ├── ThemeContext.ts        # Theme context (light/dark)
│   │   └── useAuth.ts             # Auth hook
│   │
│   ├── 📁 types/                   # TypeScript type definitions
│   │   └── index.ts               # Shared types and interfaces
│   │
│   ├── 📁 styles/                  # CSS stylesheets
│   │   ├── global.css             # Global styles and CSS variables
│   │   ├── index.css              # Root styles
│   │   ├── 📁 components/         # Component-specific styles
│   │   │   ├── AlbumCard.css
│   │   │   ├── ArtistCard.css
│   │   │   ├── Header.css
│   │   │   └── ...
│   │   └── 📁 pages/              # Page-specific styles
│   │       ├── Home.css
│   │       ├── Reviews.css
│   │       └── ...
│   │
│   ├── App.tsx                     # Root application component
│   ├── App.css                     # Application-level styles
│   ├── main.tsx                    # Application entry point
│   └── vite-env.d.ts              # Vite type definitions
│
├── 📁 server/                      # Backend source code
│   ├── 📁 src/
│   │   ├── index.js               # Express server entry point
│   │   │
│   │   ├── 📁 models/             # Mongoose schemas
│   │   │   ├── AlbumReview.js     # Review data model
│   │   │   └── User.js            # User data model
│   │   │
│   │   ├── 📁 routes/             # API route handlers
│   │   │   ├── billboard.js       # Billboard Hot 100 endpoints
│   │   │   ├── discography.js     # Music catalog endpoints
│   │   │   ├── reviews.js         # Review CRUD operations
│   │   │   ├── search.js          # Natural language search
│   │   │   └── users.js           # User management
│   │   │
│   │   └── 📁 services/           # Business logic services
│   │       └── spotifyServices.js # Spotify API integration
│   │
│   ├── 📁 tests/                   # Backend test suites
│   │   ├── jest.setup.js          # Jest configuration
│   │   ├── reviewRoutes.test.js   # Review API tests
│   │   └── userRoutes.test.js     # User API tests
│   │
│   ├── Dockerfile                  # Docker container config
│   ├── package.json               # Backend dependencies
│   └── .env.example               # Environment template
│
├── 📁 public/                      # Static assets
│   └── _redirects                 # Netlify SPA routing config
│
├── 📁 .github/workflows/          # CI/CD pipelines
│   └── deploy-apprunner.yml       # AWS App Runner deployment
│
├── package.json                    # Root dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── eslint.config.js               # ESLint rules
├── .env.example                    # Frontend env template
└── README.md                       # This file
```

---

## 📡 API Documentation

### **Base URL**
```
Development: http://localhost:4001
Production: https://your-api-domain.com
```

### **Endpoints**

#### **Reviews**

##### `POST /api/reviews`
Create or update a review.

**Request Body:**
```json
{
  "userSpotifyId": "user123",
  "albumId": "spotify:album:xyz",
  "overallRating": 85,
  "baseOverallRating": 80,
  "adjustedOverallRating": 85,
  "scoreModifiers": {
    "emotionalStoryConnection": 2.5,
    "cohesionAndFlow": -2.5,
    "artistIdentityOriginality": 5,
    "visualAestheticEcosystem": 0
  },
  "songRatings": [
    { "trackId": "track1", "trackName": "Song Title", "rating": 4.5 }
  ],
  "writeup": "This album is incredible...",
  "albumMeta": {
    "name": "Album Name",
    "artists": ["Artist Name"],
    "image": "https://i.scdn.co/image/..."
  }
}
```

**Response:**
```json
{
  "_id": "60d5ec49f1a2c8b1f8e4e1a1",
  "userSpotifyId": "user123",
  "albumId": "spotify:album:xyz",
  "overallRating": 85,
  "createdAt": "2025-12-03T10:30:00.000Z",
  "updatedAt": "2025-12-03T10:30:00.000Z"
}
```

##### `GET /api/reviews`
Get all reviews (recent feed, limit 200).

**Response:**
```json
[
  {
    "_id": "60d5ec49f1a2c8b1f8e4e1a1",
    "userSpotifyId": "user123",
    "albumId": "spotify:album:xyz",
    "albumName": "Album Name",
    "albumArtists": ["Artist Name"],
    "albumImage": "https://i.scdn.co/image/...",
    "overallRating": 85,
    "writeup": "This album is incredible...",
    "createdAt": "2025-12-03T10:30:00.000Z"
  }
]
```

##### `GET /api/reviews/album/:albumId`
Get all reviews for a specific album.

##### `GET /api/reviews/user/:spotifyId`
Get all reviews by a specific user.

**Query Parameters:**
- `albumId` (optional) - Filter to specific album

##### `DELETE /api/reviews/:userSpotifyId/:albumId`
Delete a review.

**Response:**
```json
{
  "message": "Review deleted successfully",
  "deletedReview": { ... }
}
```

---

#### **Discography**

##### `GET /api/discography/top-tracks`
Get popular tracks (no auth required).

**Query Parameters:**
- `page` (default: 0)
- `limit` (default: 50)
- `genre` (optional)

**Response:**
```json
{
  "tracks": [
    {
      "id": "spotify:track:xyz",
      "name": "Track Name",
      "artists": ["Artist Name"],
      "album": "Album Name",
      "image": "https://i.scdn.co/image/...",
      "popularity": 85
    }
  ],
  "total": 500,
  "page": 0,
  "limit": 50
}
```

##### `GET /api/discography/genres`
Get available music genres.

---

#### **Search**

##### `POST /api/search/natural-language`
Process natural language music queries using AI.

**Request Body:**
```json
{
  "query": "albums like Blonde by Frank Ocean"
}
```

**Response:**
```json
{
  "interpretation": "User wants R&B albums similar to Frank Ocean's style",
  "results": [
    {
      "album": "Channel Orange",
      "artist": "Frank Ocean",
      "id": "spotify:album:xyz"
    }
  ]
}
```

---

#### **Billboard**

##### `GET /api/billboard/hot-100`
Get current Billboard Hot 100 chart.

**Response:**
```json
{
  "chart": "Hot 100",
  "week": "2025-12-03",
  "songs": [
    {
      "rank": 1,
      "title": "Song Title",
      "artist": "Artist Name",
      "lastWeek": 2,
      "peakPosition": 1,
      "weeksOnChart": 10
    }
  ]
}
```

---

#### **Users**

##### `POST /api/users/sync`
Sync user data from Spotify OAuth.

**Request Body:**
```json
{
  "spotifyId": "user123",
  "displayName": "John Doe",
  "avatarUrl": "https://i.scdn.co/image/..."
}
```

---

#### **Health Check**

##### `GET /api/health`
Server health check.

**Response:**
```json
{
  "ok": true,
  "service": "recordcrate-api",
  "time": "2025-12-03T10:30:00.000Z"
}
```

---

## 🚢 Deployment

### **Frontend Deployment (Netlify)**

RecordCrate is optimized for Netlify with automatic SPA routing.

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Log in to [Netlify](https://app.netlify.com/)
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **GitHub** and authorize
   - Choose `A71as/RecordCrate` repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch**: `main`

4. **Add Environment Variables**
   
   In Netlify dashboard → **Site settings** → **Environment variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_SPOTIFY_REDIRECT_URI=https://your-site.netlify.app/callback
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Deploy**
   
   Click **"Deploy site"** - automatic deployments trigger on every push to `main`

**SPA Routing:**
The `public/_redirects` file ensures React Router works correctly:
```
/*    /index.html   200
```

---

### **Backend Deployment (AWS App Runner)**

**Recommended: Direct GitHub Integration**

1. **Navigate to AWS App Runner**
   - Open [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
   - Click **"Create service"**

2. **Source Configuration**
   - **Repository type**: Source code repository
   - **Connect to GitHub**: Authorize AWS App Runner
   - **Repository**: `A71as/RecordCrate`
   - **Branch**: `main`
   - **Source directory**: `server/`

3. **Build Settings**
   - **Runtime**: Node.js 20
   - **Build command**: `npm ci`
   - **Start command**: `npm start`
   - **Port**: `4001`

4. **Configure Service**
   - **Service name**: `recordcrate-api`
   - **CPU**: 1 vCPU
   - **Memory**: 2 GB
   - **Health check**: `/api/health`

5. **Environment Variables**
   
   Add in **Environment variables** section:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=4001
   CORS_ORIGIN=https://your-frontend-url.netlify.app
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=production
   ```

6. **Auto-Deployment**
   - Enable **Automatic deployment**
   - Service rebuilds and deploys on every push to `main`

7. **Custom Domain (Optional)**
   - Configure in **Custom domain** section
   - Update `VITE_API_BASE_URL` in Netlify

---

### **Alternative: Docker Deployment**

#### **Build Docker Image**
```bash
cd server
docker build -t recordcrate-api .
docker run -p 4001:4001 --env-file .env recordcrate-api
```

#### **Deploy to AWS ECR + App Runner**
1. Push image to Amazon ECR
2. Create App Runner service from ECR image
3. Use GitHub Actions workflow (`.github/workflows/deploy-apprunner.yml`)

---

### **Database: MongoDB Atlas**

1. **Create Cluster**
   - Free M0 tier available
   - Choose region closest to your backend

2. **Network Access**
   - Whitelist `0.0.0.0/0` (all IPs) for App Runner
   - Or use VPC peering for production

3. **Database User**
   - Create user with **Read/Write** permissions
   - Use in `MONGODB_URI` connection string

4. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/recordcrate?retryWrites=true&w=majority
   ```

---

## 💻 Development

### **Development Scripts**

#### **Frontend**
```bash
npm run dev          # Start Vite dev server (port 5175)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
```

#### **Backend**
```bash
cd server
npm run dev          # Start with nodemon (hot-reload)
npm start            # Production mode
npm run lint         # Check code style
npm test             # Run Jest tests
```

#### **Full Stack**
```bash
npm run dev          # Runs both frontend + backend concurrently
```

---

### **Code Quality**

#### **Linting**
```bash
# Check frontend
npm run lint

# Auto-fix frontend
npm run lint:fix

# Check backend
cd server && npm run lint
```

#### **Type Checking**
```bash
# TypeScript compilation check
npx tsc --noEmit
```

#### **Testing**
```bash
cd server
npm test             # Run all tests
npm test -- --watch  # Watch mode
```

---

### **Development Tips**

1. **Hot Module Replacement (HMR)**
   - Vite provides instant HMR for React components
   - Backend uses nodemon for automatic restarts

2. **TypeScript**
   - All frontend code is fully typed
   - Enable strict mode for production builds

3. **API Testing**
   - Use Postman or Thunder Client for endpoint testing
   - Import collection from `server/tests/`

4. **Debugging**
   - React DevTools for component inspection
   - VS Code debugger configuration included

5. **Performance**
   - Use React DevTools Profiler
   - Monitor network tab for API calls
   - Check Lighthouse scores

---

## 🤝 Contributing

Contributions are welcome! Follow these guidelines to contribute effectively.

### **How to Contribute**

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/RecordCrate.git
   cd RecordCrate
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add TypeScript types for new features
   - Update tests if applicable

4. **Test Your Changes**
   ```bash
   npm run lint
   npm run build
   cd server && npm test
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```
   
   **Commit Message Format:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation update
   - `style:` Code style/formatting
   - `refactor:` Code refactoring
   - `test:` Test updates
   - `chore:` Build/tooling changes

6. **Push to GitHub**
   ```bash
   git push origin feature/amazing-new-feature
   ```

7. **Open Pull Request**
   - Go to original repository
   - Click **"New Pull Request"**
   - Select your branch
   - Describe changes thoroughly

---

### **Development Guidelines**

- ✅ **TypeScript**: Add types for all new code
- ✅ **ESLint**: Fix all linting errors before committing
- ✅ **Components**: Create reusable, well-documented components
- ✅ **CSS**: Follow existing naming conventions (BEM-style)
- ✅ **API**: Document new endpoints in README
- ✅ **Testing**: Add tests for critical functionality
- ✅ **Accessibility**: Ensure keyboard navigation and ARIA labels
- ✅ **Mobile**: Test responsive design on multiple devices

---

### **Bug Reports**

Found a bug? Help us fix it!

1. Check [existing issues](https://github.com/A71as/RecordCrate/issues)
2. Create new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS information

---

### **Feature Requests**

Have an idea? We'd love to hear it!

1. Open an issue with `[Feature Request]` tag
2. Describe the feature thoroughly
3. Explain the use case
4. Provide mockups if possible

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 A71as

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE](LICENSE) for full details.

---

## 🙏 Acknowledgments

### **Technologies & Libraries**

- **[React](https://reactjs.org/)** - UI component library
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[Express](https://expressjs.com/)** - Minimalist web framework
- **[MongoDB](https://www.mongodb.com/)** - Document database
- **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - Music catalog
- **[Google Gemini AI](https://ai.google.dev/)** - Natural language processing
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon library
- **[Netlify](https://www.netlify.com/)** - Frontend hosting
- **[AWS App Runner](https://aws.amazon.com/apprunner/)** - Backend container service

### **Inspiration**

RecordCrate draws inspiration from:
- **RateYourMusic** - Community-driven music database
- **Discogs** - Vinyl collection management
- **Spotify** - Modern music streaming UI/UX
- **Letterboxd** - Social film discovery and reviews

### **Contributors**

Special thanks to all contributors who have helped shape RecordCrate!

<a href="https://github.com/A71as/RecordCrate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=A71as/RecordCrate" />
</a>

---

## 📞 Contact & Support

### **Project Maintainer**

**Ahmed Alami** ([@A71as](https://github.com/A71as))
- GitHub: [@A71as](https://github.com/A71as)
- Project Link: [https://github.com/A71as/RecordCrate](https://github.com/A71as/RecordCrate)

### **Support**

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/A71as/RecordCrate/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/A71as/RecordCrate/discussions)
- 📧 **Email**: Create an issue on GitHub

---

## 🗺️ Roadmap

### **Upcoming Features**

- [ ] Social features (follow users, share reviews)
- [ ] Playlist generation from reviewed albums
- [ ] Export reviews to PDF/Markdown
- [ ] Advanced analytics dashboard
- [ ] Collaborative playlists
- [ ] Integration with Last.fm scrobbling
- [ ] Mobile app (React Native)
- [ ] Podcast episode reviews
- [ ] Concert tracking and recommendations

### **In Progress**

- [ ] Improved natural language search accuracy
- [ ] Review comment threads
- [ ] User reputation system

### **Recently Completed** ✅

- ✅ Community reviews page
- ✅ MongoDB Atlas integration
- ✅ Dark/light theme system
- ✅ Responsive mobile design
- ✅ Billboard Hot 100 integration
- ✅ Natural language search with Gemini AI

---

<div align="center">

### **Built with ❤️ for music lovers, by music lovers**

🎵 **Start exploring music differently with RecordCrate** 🎵

[![GitHub Stars](https://img.shields.io/github/stars/A71as/RecordCrate?style=social)](https://github.com/A71as/RecordCrate)
[![GitHub Forks](https://img.shields.io/github/forks/A71as/RecordCrate?style=social)](https://github.com/A71as/RecordCrate/fork)

[⬆ Back to Top](#-recordcrate)

</div>
