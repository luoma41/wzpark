const COS = require('cos-nodejs-sdk-v5');

const secretId = process.env.COS_SECRET_ID;
const secretKey = process.env.COS_SECRET_KEY;
const cosAppId = process.env.COS_APPID;
const cosBucket = process.env.COS_BUCKET;
const cosRegion = process.env.COS_REGION;

if (!secretId || !secretKey) {
  throw new Error('FATAL: COS_SECRET_ID and COS_SECRET_KEY environment variables are required');
}
if (!cosAppId || !cosBucket || !cosRegion) {
  throw new Error('FATAL: COS_APPID, COS_BUCKET, and COS_REGION environment variables are required');
}

const cos = new COS({
  SecretId: secretId,
  SecretKey: secretKey,
});

const bucket = `${cosBucket}-${cosAppId}`;
const region = cosRegion;

module.exports = { cos, bucket, region };
