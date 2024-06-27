const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE_JSON,
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

module.exports = bucket;
