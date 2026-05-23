const { getDb } = require('../../lib/db');
const { sendSuccess, sendError } = require('../../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  try {
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
      version: '2.0',
      totalDbFiles: usedKeys.length,
      orphansFound: 0,
      orphanKeys: [],
      message: 'COS cleanup temporarily disabled. Total DB files: ' + usedKeys.length,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return sendError(res, 500, err.message + ' | STACK: ' + (err.stack || 'none'));
  }
};
