const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError, sendSuccess } = require('../../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const { email, password } = req.body || {};
  if (!email || !password) return sendError(res, 400, 'Email and password required');

  if (email !== process.env.ADMIN_EMAIL) return sendError(res, 401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) return sendError(res, 401, 'Invalid credentials');

  const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  sendSuccess(res, { token });
};
