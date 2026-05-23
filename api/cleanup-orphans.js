const { getDb } = require('../../lib/db');
const { cos, bucket, region } = require('../../lib/cos');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');
  if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

  const dryRun = req.body?.dryRun !== false;

  const db = await getDb();
  const photos = db.collection('photos');

  const photoDocs = await photos.find({}, { projection: { cosUrl: 1 } }).toArray();
  const usedKeys = new Set(photoDocs.map(p => {
    try {
      const url = new URL(p.cosUrl);
      return decodeURIComponent(url.pathname.slice(1));
    } catch {
      return null;
    }
  }).filter(Boolean));

  if (usedKeys.size === 0) {
    return sendError(res, 400, 'No photos found in database. Cleanup aborted to prevent accidental deletion.');
  }

  let allCosKeys = [];
  try {
    const data = await new Promise((resolve, reject) => {
      cos.getBucket({
        Bucket: bucket,
        Region: region,
        Prefix: 'photos/',
        MaxKeys: 1000,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    allCosKeys = (data.Contents || []).map(item => item.Key);
  } catch (err) {
    console.error('COS getBucket error:', err);
    const errMsg = err?.message || err?.error || err?.code || JSON.stringify(err);
    return sendError(res, 500, `COS list failed: ${errMsg}. Check that COS_SECRET_ID/COS_SECRET_KEY has ListBucket permission.`);
  }

  const orphans = allCosKeys.filter(key => !usedKeys.has(key));

  let deleted = [];
  if (!dryRun && orphans.length > 0) {
    try {
      const deleteResult = await new Promise((resolve, reject) => {
        cos.deleteMultipleObject({
          Bucket: bucket,
          Region: region,
          Objects: orphans.map(key => ({ Key: key })),
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      deleted = orphans;
      console.log('COS delete result:', deleteResult);
    } catch (err) {
      console.error('Batch delete error:', err);
    }
  }

  return sendSuccess(res, {
    dryRun,
    totalCosFiles: allCosKeys.length,
    totalDbFiles: usedKeys.size,
    orphansFound: orphans.length,
    deleted: deleted.length,
    deletedKeys: deleted,
    orphanKeys: dryRun ? orphans : undefined,
  });
}

module.exports = authMiddleware(handler);
