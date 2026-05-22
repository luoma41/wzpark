const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

const bucket = `${process.env.COS_APPID}-${process.env.COS_BUCKET}`;
const region = process.env.COS_REGION;

module.exports = { cos, bucket, region };
