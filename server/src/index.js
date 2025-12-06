import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import reviewsRouter from './routes/reviews.js';
import usersRouter from './routes/users.js';
import discographyRouter from './routes/discography.js';
import searchRouter from './routes/search.js';
import nlSearchRouter from './routes/nl-search.js';
import billboardRouter from './routes/billboard.js';
import authRouter from './routes/auth.js';
import dailyRecommendationRouter from './routes/daily-recommendation.js';

const app = express();

const PORT = process.env.PORT || 4001;
const MONGODB_URI = process.env.MONGODB_URI || '';
// Allow multiple origins in dev. Support comma-separated CORS_ORIGIN.
const DEFAULT_ORIGINS = ['http://localhost:5175', 'http://127.0.0.1:5175'];
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const ORIGINS = CORS_ORIGIN
  ? CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ORIGINS;

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Add error handling middleware BEFORE routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'recordcrate-api', time: new Date().toISOString() });
});

// Wrap route mounting in try-catch
try {
  // Always mount discography, search, and billboard; they do not require DB
  app.use('/api/discography', discographyRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/nl-search', nlSearchRouter);
  app.use('/api/billboard', billboardRouter);
  app.use('/api/auth', authRouter);
  console.log('[recordcrate-api] Mounted discography, search, nl-search, billboard, and auth routes');
} catch (e) {
  console.error('[recordcrate-api] Failed to mount routes:', e);
  process.exit(1);
}

// Mount DB-backed routes only when Mongo is configured
function mountDbRoutes() {
  try {
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/daily-recommendation', dailyRecommendationRouter);
    console.log('[recordcrate-api] Mounted DB routes');
  } catch (e) {
    console.error('[recordcrate-api] Failed to mount DB routes:', e);
  }
}

// Global error handler - MUST be after routes
app.use((err, req, res, next) => {
  console.error('[recordcrate-api] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
  // Global error handlers to prevent crashes
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error(error.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  if (!MONGODB_URI) {
    console.warn('[recordcrate-api] No MONGODB_URI provided. Starting in discography-only mode.');
    app.listen(PORT, () => console.log(`API listening (discography-only) on http://127.0.0.1:${PORT}`));
    return;
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  mountDbRoutes();
  app.listen(PORT, () => console.log(`API listening on http://127.0.0.1:${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
