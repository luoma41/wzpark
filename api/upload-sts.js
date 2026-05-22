const COS = require('cos-nodejs-sdk-v5');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

const handler = async (req, res) => {
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

  const cos = new COS({ SecretId: process.env.COS_SECRET_ID, SecretKey: process.env.COS_SECRET_KEY });

  try {
    const data = await cos.getCredential({
      policy: {
        version: '2.0',
        statement: [{
          action: ['name/cos:PutObject', 'name/cos:InitiateMultipartUpload'],
          effect: 'allow',
          resource: [`qcs::cos:${process.env.COS_REGION}:uid/${process.env.COS_APPID}:${process.env.COS_APPID}-${process.env.COS_BUCKET}/*`],
        }],
      },
      durationSeconds: 3600,
    });

    sendSuccess(res, {
      tmpSecretId: data.credentials.tmpSecretId,
      tmpSecretKey: data.credentials.tmpSecretKey,
      sessionToken: data.credentials.sessionToken,
      expiredTime: data.expiredTime,
      bucket: `${process.env.COS_APPID}-${process.env.COS_BUCKET}`,
      region: process.env.COS_REGION,
    });
  } catch (err) {
    console.error('STS credential error:', err);
    sendError(res, 500, 'Failed to get STS credentials');
  }
};

module.exports = authMiddleware(handler);
