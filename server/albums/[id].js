const { getDb } = require('../../lib/db');
const { sendSuccess, sendError } = require('../../lib/utils');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  const { id } = req.query;
  if (!id) return sendError(res, 400, 'ID required');

  const db = await getDb();
  const albums = db.collection('albums');
  const photos = db.collection('photos');

  let album;
  try {
    album = await albums.findOne({ _id: new ObjectId(id) });
  } catch {
    album = await albums.findOne({ city: id });
  }

  if (!album) return sendError(res, 404, 'Album not found');

  const photoList = await photos.find({ city: album.city }).sort({ takenAt: -1 }).toArray();

  sendSuccess(res, { album, photos: photoList });
};
