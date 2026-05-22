const { getDb } = require('../../lib/db');
const { sendSuccess, sendError } = require('../../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { token, password } = req.body || {};
  if (!token || !password) return sendError(res, 400, 'Token and password required');

  const db = await getDb();
  const shares = db.collection('shares');
  const albums = db.collection('albums');
  const photos = db.collection('photos');

  const share = await shares.findOne({ token });
  if (!share) return sendError(res, 404, 'Share not found');
  if (share.expiresAt && new Date() > share.expiresAt) return sendError(res, 410, 'Share expired');
  if (share.password !== password) return sendError(res, 403, 'Invalid password');

  await shares.updateOne({ token }, { $inc: { viewCount: 1 } });

  const album = await albums.findOne({ _id: share.albumId });
  if (!album) return sendError(res, 404, 'Album not found');

  const photoList = await photos.find({ city: album.city }).sort({ takenAt: -1 }).toArray();

  sendSuccess(res, { album, photos: photoList });
};
