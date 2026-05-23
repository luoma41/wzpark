const { getDb } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

async function handler(req, res) {
  const db = await getDb();
  const albums = db.collection('albums');

  if (req.method === 'GET') {
    const list = await albums.find({ photoCount: { $gt: 0 } }).sort({ photoCount: -1 }).toArray();
    return sendSuccess(res, list);
  }

  if (req.method === 'PUT') {
    if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

    const { city, description, coverPhotoId } = req.body || {};
    if (!city) return sendError(res, 400, 'City required');

    const existing = await albums.findOne({ city });
    if (!existing) return sendError(res, 404, 'Album not found');

    const update = { updatedAt: new Date() };
    if (description !== undefined) update.description = description;
    if (coverPhotoId !== undefined) update.coverPhotoId = coverPhotoId;

    await albums.updateOne({ city }, { $set: update });
    return sendSuccess(res, { updated: true });
  }

  return sendError(res, 405, 'Method not allowed');
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return authMiddleware(handler)(req, res);
};
