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

    // Clean up dirty data
    try {
      await albums.deleteMany({ $or: [{ city: null }, { city: '' }, { city: { $exists: false } }] });
    } catch (e) {
      console.log('DeleteMany error:', e.message);
    }

    // Drop problematic unique index on city
    try {
      const indexes = await albums.indexes();
      for (const idx of indexes) {
        if (idx.unique && idx.key && idx.key.city !== undefined) {
          await albums.dropIndex(idx.name);
          console.log('Dropped unique city index:', idx.name);
        }
      }
    } catch (e) {
      console.log('Index drop error:', e.message);
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
        let album = await albums.findOne({ city: safeCity });
        if (album) {
          await albums.updateOne(
            { city: safeCity },
            { $inc: { photoCount: count }, $set: { updatedAt: now } }
          );
          console.log('Updated existing album:', safeCity);
        } else {
          await albums.insertOne({
            city: safeCity,
            province: items.find(i => i.city === city)?.province || '',
            coverPhotoId: null,
            description: '',
            photoCount: count,
            createdAt: now,
            updatedAt: now,
          });
          console.log('Created new album:', safeCity);
        }
      } catch (err) {
        if (err.code === 11000) {
          console.warn('Duplicate key for city:', safeCity, '- trying update instead');
          await albums.updateOne(
            { city: safeCity },
            { $inc: { photoCount: count }, $set: { updatedAt: now } }
          );
        } else {
          throw err;
        }
      }
    }

    // Recalculate photoCount for all albums to ensure consistency
    const allAlbums = await albums.find({}, { projection: { city: 1 } }).toArray();
    for (const album of allAlbums) {
      const safeCity = album.city;
      if (!safeCity) continue;
      const actualCount = await photos.countDocuments({ city: safeCity });
      await albums.updateOne(
        { city: safeCity },
        { $set: { photoCount: actualCount } }
      );
      console.log('Recalculated photoCount for', safeCity, ':', actualCount);
    }

    return sendSuccess(res, { insertedIds: result.insertedIds });
  }

  return sendError(res, 405, 'Method not allowed');
};

module.exports = authMiddleware(handler);
