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
import photosIndex from '../../api/photos/index.js';
import photosById from '../../api/photos/[id].js';
import albumsIndex from '../../api/albums/index.js';
import albumsById from '../../api/albums/[id].js';
import sharesIndex from '../../api/shares/index.js';
import sharesVerify from '../../api/shares/verify.js';
import authLogin from '../../api/auth/login.js';
import uploadSts from '../../api/upload-sts.js';
import mapData from '../../api/map-data.js';

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
