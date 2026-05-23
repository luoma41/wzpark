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
    if (!req.body || (typeof req.body !== 'object' && !Array.isArray(req.body))) {
      return sendError(res, 400, 'Request body must be an object or array');
    }

    const items = Array.isArray(req.body) ? req.body : [req.body];
    if (items.length === 0) return sendError(res, 400, 'No photos provided');

    const now = new Date();

    for (const item of items) {
      if (!item.filename || !item.cosUrl || !item.city) {
        return sendError(res, 400, 'Missing required fields: filename, cosUrl, city');
      }
      item.createdAt = now;
      item.albumId = item.albumId || null;
    }

    const result = await photos.insertMany(items);

    // Drop problematic unique index on albums.city if it exists
    try {
      const indexes = await albums.indexes();
      for (const idx of indexes) {
        if (idx.unique && idx.key && idx.key.city !== undefined) {
          await albums.dropIndex(idx.name);
          console.log('Dropped unique city index:', idx.name);
        }
      }
    } catch (e) {
      console.log('Index check/drop error:', e.message);
    }

    // Update album photoCount
    const cityGroups = {};
    items.forEach(p => { cityGroups[p.city] = (cityGroups[p.city] || 0) + 1; });
    console.log('cityGroups:', cityGroups);

    for (const [city, count] of Object.entries(cityGroups)) {
      const safeCity = city || '未知城市';
      if (!safeCity || safeCity === '未知城市') {
        console.warn('Skipping album creation for invalid city:', city);
        continue;
      }
      try {
        await albums.updateOne(
          { city: safeCity },
          {
            $inc: { photoCount: count },
            $set: { updatedAt: now },
            $setOnInsert: {
              province: items.find(i => i.city === city)?.province || '',
              coverPhotoId: null,
              description: '',
              createdAt: now,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        if (err.code === 11000) {
          console.warn('Duplicate key ignored for city:', safeCity, err.message);
        } else {
          throw err;
        }
      }
    }

    return sendSuccess(res, { insertedIds: result.insertedIds });
  }

  return sendError(res, 405, 'Method not allowed');
};

module.exports = authMiddleware(handler);
