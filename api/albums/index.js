const { getDb } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

async function handler(req, res) {
  const db = await getDb();
  const albums = db.collection('albums');

  if (req.method === 'GET') {
    const list = await albums.find({}).sort({ photoCount: -1 }).toArray();
    return sendSuccess(res, list);
  }

  if (req.method === 'PUT') {
    const { city, description, coverPhotoId } = req.body || {};
    if (!city) return sendError(res, 400, 'City required');

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
