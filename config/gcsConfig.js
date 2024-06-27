const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Parsear las credenciales de la variable de entorno JSON
const keyfileContent = JSON.parse(process.env.GOOGLE_CLOUD_KEYFILE_JSON);

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: keyfileContent,
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

module.exports = bucket;
