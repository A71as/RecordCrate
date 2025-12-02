import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4002;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ ok: true, service: 'test-minimal', time: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`Minimal server on http://localhost:${PORT}`));
