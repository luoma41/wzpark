const { getDb } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

const handler = async (req, res) => {
  const db = await getDb();
  const photos = db.collection('photos');
  const albums = db.collection('albums');

  if (req.method === 'GET') {
    const { city, albumId } = req.query || {};
    const filter = {};
    if (city) filter.city = city;
    if (albumId) filter.albumId = albumId;

    const list = await photos.find(filter).sort({ takenAt: -1 }).toArray();
    return sendSuccess(res, list);
  }

  if (req.method === 'POST') {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const now = new Date();

    for (const item of items) {
      if (!item.filename || !item.cosUrl || !item.city) {
        return sendError(res, 400, 'Missing required fields');
      }
      item.createdAt = now;
      item.albumId = item.albumId || null;
    }

    const result = await photos.insertMany(items);

    // Update album photoCount
    const cityGroups = {};
    items.forEach(p => { cityGroups[p.city] = (cityGroups[p.city] || 0) + 1; });

    for (const [city, count] of Object.entries(cityGroups)) {
      const album = await albums.findOne({ city });
      if (album) {
        await albums.updateOne({ city }, { $inc: { photoCount: count }, $set: { updatedAt: now } });
      } else {
        await albums.insertOne({
          city,
          province: items.find(i => i.city === city)?.province || '',
          coverPhotoId: items.find(i => i.city === city)?._id || null,
          description: '',
          photoCount: count,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return sendSuccess(res, { insertedIds: result.insertedIds });
  }

  return sendError(res, 405, 'Method not allowed');
};

module.exports = authMiddleware(handler);
