const jwt = require('jsonwebtoken');
const { sendError } = require('./utils');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

function authMiddleware(handler) {
  return async (req, res) => {
    let decoded;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return sendError(res, 401, 'Token required');

      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Token expired');
      if (err.name === 'JsonWebTokenError') return sendError(res, 401, 'Invalid token format');
      return sendError(res, 401, 'Invalid token');
    }

    req.user = decoded;
    try {
      return await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      return sendError(res, 500, `Server error: ${err.message}`);
    }
  };
}

module.exports = { authMiddleware };
