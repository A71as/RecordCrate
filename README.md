# 🎵 RecordCrate

**The home for serious listeners.** RecordCrate is a modern music discovery and cataloging platform that blends deep catalog data with tools built for collectors, DJs, and casual crate diggers alike. Track your listening journey, write thoughtful reviews, and explore music with precision rating systems.

## 🎨 Design Philosophy

RecordCrate features a **vintage vinyl + wooden crate aesthetic** with a carefully curated color palette:
- **Vinyl Black** (#1a1a1d) - Deep, rich backgrounds
- **Warm Wood** (#8b6f47) - Crate-inspired accents
- **Amber Gold** (#d4a574) - Warm highlights and interactive elements
- **Cream** (#f4ece1) - Soft text and contrast

## ✨ Key Features

### 📀 Music Discovery
- **Discover Page** - Explore new releases, popular albums, and personalized recommendations with dynamic filters
- **Discography Browser** - Genre-based exploration of popular music with no login required
- **Advanced Search** - Find specific albums, artists, and tracks across the Spotify catalog
- **Natural Language Search** - Use AI-powered queries like "albums like Blonde by Frank Ocean" or "sad indie music from the 2010s"

### ⭐ Rating & Review System
- **Dual Rating Scale**
  - Album scores: 0-100% with precise slider control
  - Track ratings: 0-5 stars with half-star precision
- **Score Modifiers** - Fine-tune album ratings with ±5% adjustments across four categories:
  - Emotional/story connection
  - Cohesion and flow
  - Artist identity and originality
  - Visual/aesthetic ecosystem
- **Track-to-Album Integration** - Track ratings automatically contribute to overall album scores
- **Rich Reviews** - Write detailed thoughts (up to 350 words) with metadata tracking

### 📊 Personal Features
- **Streak Calendar** - Track your daily album rating habits (AI recommendations coming soon)
- **Review Management** - Edit or delete reviews with confirmation safeguards
- **Profile Dashboard** - View your listening history and review collection
- **Offline-First** - LocalStorage fallback ensures your data is never lost

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** + **TypeScript** - Type-safe component architecture
- **Vite** - Lightning-fast dev server and optimized production builds
- **React Router** - Client-side routing with state management
- **Lucide Icons** - Beautiful, consistent iconography
- **CSS Custom Properties** - Theme-driven styling with gradients, shadows, and smooth transitions

### Backend Stack
- **Node.js** + **Express** - RESTful API server
- **MongoDB** + **Mongoose** - Document database with schema validation
- **Spotify Web API** - Music catalog integration with client credentials flow
- **CORS** - Multi-origin support for flexible deployments

### Data Flow
1. **Primary Path**: Backend-first architecture with server-side Spotify API calls
2. **Fallback Path**: Client-side CSV + oEmbed enrichment for no-auth browsing
3. **Final Fallback**: Curated sample data when external services unavailable

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (optional - discography works without it)
- Spotify API credentials (optional - fallbacks enabled)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/A71as/RecordCrate.git
   cd RecordCrate
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`

3. **Backend Setup**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration (see below)
   npm install
   npm run dev
   ```
   Backend runs at `http://localhost:4000`

4. **Environment Variables**

   **Frontend** (`.env` in root):
   ```env
   VITE_API_BASE_URL=http://localhost:4000
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
   ```

   **Backend** (`server/.env`):
   ```env
   MONGODB_URI=mongodb://localhost:27017/recordcrate  # Optional
   PORT=4000
   CORS_ORIGIN=http://localhost:5173
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   GEMINI_API_KEY=your_gemini_api_key  # Optional - for natural language search
   ```

5. **Optional: API Credentials**
   
   **Spotify API** (recommended):
   - Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create an app and add `http://localhost:5173/callback` as a redirect URI
   - Copy Client ID and Client Secret to your `.env` files
   
   **Gemini AI API** (optional for natural language search):
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to your server `.env` file as `GEMINI_API_KEY`
   
   - **Note**: The app works without credentials using fallback data sources

## 📁 Project Structure

```
RecordCrate/
├── src/                          # Frontend source
│   ├── components/              # Reusable React components
│   │   ├── AlbumCard.tsx       # Album display card
│   │   ├── ArtistCard.tsx      # Artist display card
│   │   ├── FilterTabs.tsx      # Content filter UI
│   │   ├── Header.tsx          # Navigation header
│   │   ├── ReviewForm.tsx      # Review creation/editing
│   │   ├── SearchInput.tsx     # Search interface
│   │   └── StarRating.tsx      # 5-star rating component
│   ├── pages/                   # Route pages
│   │   ├── Home.tsx            # Landing page (About content)
│   │   ├── Discover.tsx        # Content discovery with filters
│   │   ├── Discography.tsx     # Genre-based browsing
│   │   ├── Search.tsx          # Album/artist search
│   │   ├── Profile.tsx         # User profile
│   │   ├── AlbumDetail.tsx     # Album details + reviews
│   │   └── ArtistDetail.tsx    # Artist discography
│   ├── services/                # API integrations
│   │   ├── spotify.ts          # Spotify API service
│   │   └── backend.ts          # Backend API client
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSpotify.ts       # Spotify data fetching
│   │   ├── useSearchLogic.ts   # Search state management
│   │   └── useClickOutside.ts  # UI interaction helper
│   ├── context/                 # React Context providers
│   │   └── useAuth.ts          # Authentication state
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts            # Shared type definitions
│   └── styles/                  # CSS styling
│       ├── App.css             # Main application styles
│       ├── global.css          # Global resets and utilities
│       ├── index.css           # Root styles
│       └── components/         # Component-specific styles
├── server/                      # Backend source
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── models/             # MongoDB schemas
│   │   │   ├── AlbumReview.js  # Review model
│   │   │   └── User.js         # User model
│   │   └── routes/             # API endpoints
│   │       ├── reviews.js      # Review CRUD operations
│   │       ├── users.js        # User management
│   │       └── discography.js  # Music catalog endpoints
│   └── Dockerfile              # Container configuration
├── public/                      # Static assets
├── .github/workflows/          # CI/CD automation
└── package.json                # Dependencies and scripts
```

## 🔌 API Endpoints

### Reviews
- `POST /api/reviews` - Create/update a review
- `GET /api/reviews/album/:albumId` - Get all reviews for an album
- `GET /api/reviews/user/:spotifyId` - Get user's reviews
- `DELETE /api/reviews/:userSpotifyId/:albumId` - Delete a review

### Natural Language Search
- `POST /api/search/natural-language` - Process natural language music queries with AI
- `GET /api/search/health` - Check AI search service status

### Discography (No-Login Browsing)
- `GET /api/discography/top-tracks?page=0&limit=50` - Get popular tracks
- `GET /api/discography/genres` - Get available genres

### Users
- `POST /api/users/sync` - Sync user data from Spotify

### Health Check
- `GET /api/health` - Server status

## 🌐 Deployment

### Frontend Deployment (Netlify)

RecordCrate is configured for seamless Netlify deployment with SPA routing via `public/_redirects`.

1. **Connect GitHub repository to Netlify**
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
   VITE_SPOTIFY_REDIRECT_URI=https://your-site.netlify.app/callback
   ```

### Backend Deployment (AWS App Runner)

**Option 1: Direct GitHub Connection** (Recommended)
1. Create App Runner service from GitHub
2. Configure source:
   - Repository: `A71as/RecordCrate`
   - Branch: `main`
   - Source directory: `server/`
   - Runtime: Node.js 20
3. Build settings:
   - Build command: `npm ci`
   - Start command: `npm start`
   - Port: `4000`
   - Health check: `/api/health`
4. Environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=4000
   CORS_ORIGIN=https://your-frontend-url.netlify.app
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
5. Enable auto-deploy for hands-free updates on push to `main`

**Option 2: ECR + GitHub Actions**
1. Build and push Docker image to ECR
2. Create App Runner service from ECR image
3. Configure GitHub secrets:
   - `AWS_ROLE_ARN` - OIDC IAM role
   - `AWS_APPRUNNER_ACCESS_ROLE_ARN` - ECR access role
4. Workflow at `.github/workflows/deploy-apprunner.yml` handles automated deployments

**MongoDB Setup**:
- **MongoDB Atlas** (recommended): Free tier available, easy connection string
- **Self-hosted**: Update `MONGODB_URI` accordingly
- **Optional**: Server runs in discography-only mode without MongoDB

### Environment Variables Summary

| Variable | Frontend | Backend | Required | Description |
|----------|----------|---------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | ❌ | No | Backend API URL (defaults to localhost:4000) |
| `VITE_SPOTIFY_CLIENT_ID` | ✅ | ❌ | No | Spotify OAuth client ID |
| `VITE_SPOTIFY_CLIENT_SECRET` | ✅ | ❌ | No | Spotify OAuth secret |
| `VITE_SPOTIFY_REDIRECT_URI` | ✅ | ❌ | No | OAuth callback URL |
| `MONGODB_URI` | ❌ | ✅ | No | MongoDB connection string |
| `PORT` | ❌ | ✅ | Yes | Server port (typically 4000) |
| `CORS_ORIGIN` | ❌ | ✅ | Yes | Allowed frontend origin |
| `SPOTIFY_CLIENT_ID` | ❌ | ✅ | No | Backend Spotify API access |
| `SPOTIFY_CLIENT_SECRET` | ❌ | ✅ | No | Backend Spotify API secret |

## 🛠️ Development Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Backend
```bash
npm run dev          # Start with hot-reload (nodemon)
npm start            # Start production server
npm run lint         # Check code style
```

## 🎯 Key Features in Detail

### No-Login Music Discovery
RecordCrate provides a full music browsing experience without requiring Spotify authentication:
1. **Backend-first**: Server fetches Spotify data using client credentials
2. **CSV + oEmbed fallback**: Parses Spotify Charts CSV and enriches with oEmbed thumbnails
3. **Curated samples**: Static fallback data when external services unavailable
4. **Popularity normalization**: Converts streams/chart position to 0-100 scale for filtering

### Advanced Rating System
- **Base Score**: Manual slider (0-100%) or auto-calculated from track ratings
- **Score Modifiers**: Four categories with ±5% range each (±2.5% increments)
  - Total modifier range: -20% to +20%
  - Final score clamped to 0-100%
- **Visual Feedback**: Color-coded badges (red → yellow → green gradient)
- **Persistence**: Backend-first with localStorage fallback for offline resilience

### Responsive Design
- **Mobile-optimized**: Header condenses, user names hide, nav wraps
- **Tablet-friendly**: Grid layouts adapt to available space
- **Desktop-enhanced**: Full feature set with optimal spacing

### Performance Optimizations
- **Code splitting**: Route-based lazy loading
- **Image optimization**: Multiple Spotify image sizes, lazy loading
- **API caching**: Client-side request deduplication
- **Debounced search**: 300ms delay reduces API calls

## 🧪 Testing & Quality

### Linting
```bash
npm run lint         # Check for code issues
npm run lint:fix     # Auto-fix linting problems
```

### Type Safety
- Full TypeScript coverage across frontend
- Shared type definitions in `src/types/index.ts`
- Strict mode enabled for maximum safety

### Code Quality Standards
- ESLint configuration with React and TypeScript rules
- Consistent code formatting across the project
- Type-aware lint rules for production-grade code

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add TypeScript types for new features
- Test changes locally before submitting
- Update documentation for significant changes

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Spotify Web API** - Music catalog and metadata
- **Lucide Icons** - Beautiful icon set
- **Vite** - Lightning-fast build tool
- **MongoDB** - Flexible document database

## 📧 Contact

Project maintained by [A71as](https://github.com/A71as)

---

**Built with ❤️ for music lovers, by music lovers.**
