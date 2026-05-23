import express from 'express';

const app = express();

// Parse JSON body
app.use(express.json());

// CORS - allow frontend requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Import existing Vercel API handlers (CommonJS, compatible with Express req/res)
import photosIndex from '../server/photos/index.js';
import photosById from '../server/photos/[id].js';
import albumsIndex from '../server/albums/index.js';
import albumsById from '../server/albums/[id].js';
import sharesIndex from '../server/shares/index.js';
import sharesVerify from '../server/shares/verify.js';
import authLogin from '../server/auth/login.js';
import uploadSts from '../server/upload-sts.js';
import mapData from '../server/map-data.js';

// Mount routes
app.all('/api/photos', photosIndex);
app.all('/api/photos/:id', (req, res) => {
  req.query = req.query || {};
  req.query.id = req.params.id;
  return photosById(req, res);
});
app.all('/api/albums', albumsIndex);
app.all('/api/albums/:id', (req, res) => {
  req.query = req.query || {};
  req.query.id = req.params.id;
  return albumsById(req, res);
});
app.all('/api/shares', sharesIndex);
app.post('/api/shares/verify', sharesVerify);
app.post('/api/auth/login', authLogin);
app.get('/api/upload-sts', uploadSts);
app.get('/api/map-data', mapData);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
