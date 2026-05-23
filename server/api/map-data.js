const { getDb } = require('../lib/db');
const { sendSuccess } = require('../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const db = await getDb();
  const photos = db.collection('photos');

  const pipeline = [
    { $match: { lat: { $ne: null, $exists: true }, lng: { $ne: null, $exists: true } } },
    {
      $group: {
        _id: { city: '$city', province: '$province' },
        lat: { $first: '$lat' },
        lng: { $first: '$lng' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        city: '$_id.city',
        province: '$_id.province',
        lat: 1,
        lng: 1,
        count: 1,
      },
    },
  ];

  const data = await photos.aggregate(pipeline).toArray();
  sendSuccess(res, data);
};
