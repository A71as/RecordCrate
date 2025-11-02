import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import reviewsRouter from './routes/reviews.js';
import usersRouter from './routes/users.js';
import discographyRouter from './routes/discography.js';

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';
// Allow multiple origins in dev. Support comma-separated CORS_ORIGIN.
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const ORIGINS = CORS_ORIGIN
  ? CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ORIGINS;

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'recordcrate-api', time: new Date().toISOString() });
});

// Always mount discography; it does not require DB
app.use('/api/discography', discographyRouter);

// Mount DB-backed routes only when Mongo is configured
function mountDbRoutes() {
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/users', usersRouter);
}

async function start() {
  if (!MONGODB_URI) {
    console.warn('[recordcrate-api] No MONGODB_URI provided. Starting in discography-only mode.');
    app.listen(PORT, () => console.log(`API listening (discography-only) on http://localhost:${PORT}`));
    return;
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  mountDbRoutes();
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
