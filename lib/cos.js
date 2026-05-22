const COS = require('cos-nodejs-sdk-v5');

const secretId = process.env.COS_SECRET_ID;
const secretKey = process.env.COS_SECRET_KEY;

if (!secretId || !secretKey) {
  console.error('FATAL: COS_SECRET_ID and COS_SECRET_KEY environment variables are required');
}

const cos = new COS({
  SecretId: secretId || '',
  SecretKey: secretKey || '',
});

const bucket = `${process.env.COS_APPID || ''}-${process.env.COS_BUCKET || ''}`;
const region = process.env.COS_REGION || '';

module.exports = { cos, bucket, region };
