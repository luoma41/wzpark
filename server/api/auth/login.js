const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError, sendSuccess } = require('../../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { password } = req.body || {};
  if (!password) return sendError(res, 400, 'Password required');

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) return sendError(res, 401, 'Invalid credentials');

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  sendSuccess(res, { token });
};
