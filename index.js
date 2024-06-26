const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./db/schema');
const { resolvers, eliminarAnunciosCaducados } = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
const { upload } = require('./db/upload');
const { uploadFileToGCS } = require('./db/upload');
const cron = require('node-cron');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

// Configurar Mongoose strictQuery
mongoose.set('strictQuery', true);

// Conectar a la base de datos
conectarDB();

const app = express();

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());

// Middleware CORS para permitir orígenes específicos
const allowedOrigins = [
  'https://foro-discusion.vercel.app',
  'https://studio.apollographql.com',
  'https://foro-de-discusion.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como las hechas desde curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Función para obtener el usuario del token JWT
const getUser = (token) => {
  try {
    if (token) {
      const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
      console.log('Usuario autenticado:', usuario);
      return usuario;
    }
    return null;
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return null;
  }
};

// Configuración del servidor Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    const usuario = getUser(token);
    console.log('Contexto del servidor Apollo:', { usuario });
    return { usuario };
  },
  introspection: true,
  playground: true,
  formatError: (err) => {
    console.error(err);
    return err;
  }
});

// Ruta para la subida de archivos
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Archivo recibido para subir:', req.file);
    const file = req.file;
    if (!file) {
      console.error('No se recibió ningún archivo.');
      return res.status(400).send('No se recibió ningún archivo.');
    }
    const publicUrl = await uploadFileToGCS(file);
    console.log('Archivo subido a GCS:', publicUrl);
    res.status(200).json({ fileUrl: publicUrl });
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    res.status(500).send('Error al subir el archivo');
  }
});

// Iniciar Apollo Server y luego aplicar los middlewares a Express
async function startServer() {
  try {
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en https://foro-discusiones-backend.onrender.com${server.graphqlPath}`);
    });

    cron.schedule('0 0 * * *', async () => {
      await eliminarAnunciosCaducados();
    });

  } catch (error) {
    console.error('Error al iniciar el servidor Apollo:', error);
  }
}

startServer();
