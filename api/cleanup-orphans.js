module.exports = async (req, res) => {
  res.status(200).json({ success: true, data: { ok: true, version: '3.0', message: 'No DB connection for debugging' } });
};
