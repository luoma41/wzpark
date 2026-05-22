const STS = require('qcloud-cos-sts');
const { authMiddleware } = require('../../lib/auth');
const { sendSuccess, sendError } = require('../../lib/utils');

const handler = async (req, res) => {
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed');

  if (req.user?.role !== 'admin') return sendError(res, 403, 'Admin access required');

  const policy = {
    version: '2.0',
    statement: [{
      action: ['name/cos:PutObject', 'name/cos:InitiateMultipartUpload'],
      effect: 'allow',
      principal: { qcs: ['*'] },
      resource: [`qcs::cos:${process.env.COS_REGION}:uid/${process.env.COS_APPID}:prefix//${process.env.COS_APPID}/${process.env.COS_BUCKET}/*`],
    }],
  };

  try {
    const data = await new Promise((resolve, reject) => {
      STS.getCredential({
        secretId: process.env.COS_SECRET_ID,
        secretKey: process.env.COS_SECRET_KEY,
        policy: policy,
        durationSeconds: 3600,
      }, (err, credential) => {
        if (err) reject(err);
        else resolve(credential);
      });
    });

    sendSuccess(res, {
      tmpSecretId: data.credentials.tmpSecretId,
      tmpSecretKey: data.credentials.tmpSecretKey,
      sessionToken: data.credentials.sessionToken,
      expiredTime: data.expiredTime,
      bucket: `${process.env.COS_BUCKET}-${process.env.COS_APPID}`,
      region: process.env.COS_REGION,
    });
  } catch (err) {
    console.error('STS credential error:', err);
    sendError(res, 500, `Failed to get STS credentials: ${err.message || err}`);
  }
};

module.exports = authMiddleware(handler);
