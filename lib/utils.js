function sendError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

function sendSuccess(res, data) {
  res.status(200).json({ success: true, data });
}

function generateToken(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { sendError, sendSuccess, generateToken };
