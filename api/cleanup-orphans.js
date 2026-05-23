const { getDb } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');
  if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

  const db = await getDb();
  const photos = db.collection('photos');

  const photoDocs = await photos.find({}, { projection: { cosUrl: 1 } }).toArray();
  const usedKeys = photoDocs.map(p => {
    try {
      const url = new URL(p.cosUrl);
      return decodeURIComponent(url.pathname.slice(1));
    } catch {
      return null;
    }
  }).filter(Boolean);

  return sendSuccess(res, {
    version: '1.0',
    totalDbFiles: usedKeys.length,
    message: 'COS cleanup temporarily disabled due to permission issues. Please clean orphan files manually from Tencent Cloud console.',
  });
}

module.exports = authMiddleware(handler);
