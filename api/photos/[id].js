const { getDb } = require('../../lib/db');
const { cos, bucket, region } = require('../../lib/cos');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');
const { ObjectId } = require('mongodb');

const handler = async (req, res) => {
  if (req.method !== 'DELETE') return sendError(res, 405, 'Method not allowed');

  const { id } = req.query;
  if (!id) return sendError(res, 400, 'ID required');

  const db = await getDb();
  const photos = db.collection('photos');
  const albums = db.collection('albums');

  const photo = await photos.findOne({ _id: new ObjectId(id) });
  if (!photo) return sendError(res, 404, 'Photo not found');

  // Delete from COS
  try {
    const key = photo.cosUrl.split('/').pop();
    await cos.deleteObject({ Bucket: bucket, Region: region, Key: key });
  } catch (err) {
    console.error('COS delete error:', err);
  }

  // Update album count
  await albums.updateOne({ city: photo.city }, { $inc: { photoCount: -1 } });

  await photos.deleteOne({ _id: new ObjectId(id) });
  sendSuccess(res, { deleted: true });
};

module.exports = authMiddleware(handler);
