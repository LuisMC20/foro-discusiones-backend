const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Parsear las credenciales de la variable de entorno JSON
const keyfileContent = JSON.parse(process.env.GOOGLE_CLOUD_KEYFILE_JSON);

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: keyfileContent,
});

const bucket = storage.bucket(process.env.BUCKET_NAME);

const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

const uploadFileToGCS = (file) => {
  return new Promise((resolve, reject) => {
    console.log('Subiendo archivo:', file.originalname);
    const blob = bucket.file(Date.now() + path.extname(file.originalname));
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on('error', (err) => {
      console.error('Error en blobStream:', err);
      reject(err);
    });

    blobStream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        console.log('Archivo subido correctamente:', publicUrl);
        resolve(publicUrl);
      } catch (error) {
        console.error('Error al obtener la URL pública:', error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { upload, uploadFileToGCS };
