const { getDb } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError, generateToken } = require('../../lib/utils');
const { ObjectId } = require('mongodb');

const handler = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

  const { albumId, password, expiresDays } = req.body || {};
  if (!albumId || !password) return sendError(res, 400, 'AlbumId and password required');
  if (!/^\d{4}$/.test(password)) return sendError(res, 400, 'Password must be 4 digits');

  const db = await getDb();
  const shares = db.collection('shares');

  const token = generateToken(8);
  const expiresAt = expiresDays ? new Date(Date.now() + expiresDays * 86400000) : null;

  await shares.insertOne({
    albumId: new ObjectId(albumId),
    token,
    password,
    viewCount: 0,
    createdAt: new Date(),
    expiresAt,
  });

  const host = process.env.VERCEL_URL || `${req.headers.host}`;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  sendSuccess(res, { token, url: `${protocol}://${host}/#/share/${token}` });
};

module.exports = authMiddleware(handler);
