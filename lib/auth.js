const jwt = require('jsonwebtoken');
const { sendError } = require('./utils');

function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return sendError(res, 401, 'Token required');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      return sendError(res, 401, 'Invalid token');
    }
  };
}

module.exports = { authMiddleware };
