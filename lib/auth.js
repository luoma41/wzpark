const jwt = require('jsonwebtoken');
const { sendError } = require('./utils');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return sendError(res, 401, 'Token required');

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Token expired');
      if (err.name === 'JsonWebTokenError') return sendError(res, 401, 'Invalid token format');
      return sendError(res, 401, 'Invalid token');
    }
  };
}

module.exports = { authMiddleware };
