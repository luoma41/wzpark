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

    const insertedItemsCities = items.map(i => ({ city: i.city, province: i.province }));
    const operationLog = [];

    const result = await photos.insertMany(items);

    // Clean up dirty data
    try {
      await albums.deleteMany({ $or: [{ city: null }, { city: '' }, { city: { $exists: false } }] });
    } catch (e) {
      console.log('DeleteMany error:', e.message);
    }

    // Drop problematic unique index on city
    let albumIndexes = [];
    try {
      albumIndexes = await albums.indexes();
      for (const idx of albumIndexes) {
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
        operationLog.push({ step: 'skip', city, safeCity, reason: 'invalid' });
        continue;
      }
      try {
        let album = await albums.findOne({ city: safeCity });
        if (album) {
          const updateRes = await albums.updateOne(
            { city: safeCity },
            { $inc: { photoCount: count }, $set: { updatedAt: now } }
          );
          operationLog.push({ step: 'update', city, safeCity, matched: updateRes.matchedCount, modified: updateRes.modifiedCount });
        } else {
          const insertRes = await albums.insertOne({
            city: safeCity,
            province: items.find(i => i.city === city)?.province || '',
            coverPhotoId: null,
            description: '',
            photoCount: count,
            createdAt: now,
            updatedAt: now,
          });
          operationLog.push({ step: 'insert', city, safeCity, insertedId: insertRes.insertedId });
        }
      } catch (err) {
        if (err.code === 11000) {
          const updateRes = await albums.updateOne(
            { city: safeCity },
            { $inc: { photoCount: count }, $set: { updatedAt: now } }
          );
          operationLog.push({ step: 'update_after_duplicate', city, safeCity, matched: updateRes.matchedCount, dupError: err.message });
        } else {
          operationLog.push({ step: 'error', city, safeCity, error: err.message, code: err.code });
          throw err;
        }
      }
    }

    // Recalculate photoCount for all albums to ensure consistency
    const allAlbumsBeforeRecalc = await albums.find({}, { projection: { city: 1, photoCount: 1 } }).toArray();
    for (const album of allAlbumsBeforeRecalc) {
      const safeCity = album.city;
      if (!safeCity) continue;
      const actualCount = await photos.countDocuments({ city: safeCity });
      await albums.updateOne(
        { city: safeCity },
        { $set: { photoCount: actualCount } }
      );
      console.log('Recalculated photoCount for', safeCity, ':', actualCount);
    }

    const finalAlbums = await albums.find({}, { projection: { city: 1, photoCount: 1 } }).toArray();
    return sendSuccess(res, {
      insertedIds: result.insertedIds,
      version: '2.3',
      albumsUpdated: Object.keys(cityGroups),
      diagnostics: {
        insertedItemsCities,
        operationLog,
        albumIndexes: albumIndexes.map(i => ({ name: i.name, key: i.key, unique: !!i.unique })),
        allAlbumsBeforeRecalc,
        finalAlbums
      }
    });
  }

  return sendError(res, 405, 'Method not allowed');
};

module.exports = authMiddleware(handler);
