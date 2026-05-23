const express = require('express');

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

// Import existing Vercel API handlers (compatible with Express req/res)
const photosIndex = require('../../api/photos/index');
const photosById = require('../../api/photos/[id]');
const albumsIndex = require('../../api/albums/index');
const albumsById = require('../../api/albums/[id]');
const sharesIndex = require('../../api/shares/index');
const sharesVerify = require('../../api/shares/verify');
const authLogin = require('../../api/auth/login');
const uploadSts = require('../../api/upload-sts');
const mapData = require('../../api/map-data');

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

module.exports = app;
