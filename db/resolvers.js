const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Publicacion = require('../models/Publicacion');
const Puntuacion = require('../models/Puntuacion');
const Comentario = require('../models/Comentario');
const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');
const Anuncio = require('../models/Anuncio');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const { uploadFileToGCS } = require('./upload');

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido, rol } = usuario;
  return jwt.sign({ id, email, nombre, apellido, rol }, secreta, { expiresIn });
};

const eliminarAnunciosCaducados = async () => {
  try {
    const now = new Date();
    await Anuncio.deleteMany({ fechaFinal: { $lt: now } });
    console.log('Anuncios caducados eliminados.');
  } catch (error) {
    console.error('Error al eliminar anuncios caducados:', error);
  }
};

const resolvers = {
  Query: {
    obtenerUsuario: async (_, __, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }
      return await Usuario.findById(usuario.id);
    },
    obtenerUsuarios: async () => {
      try {
        const usuarios = await Usuario.find({});
        return usuarios;
      } catch (error) {
        throw new Error('Error al obtener los usuarios');
      }
    },
    obtenerCategorias: async () => {
      try {
        const categorias = await Categoria.find({});
        return categorias.map(categoria => ({
          ...categoria.toObject(),
          id: categoria._id.toString(),
          creado: categoria.creado.toISOString(),
        }));
      } catch (error) {
        throw new Error('Error al obtener las categorías');
      }
    },
    obtenerCategoria: async (_, { id }) => {
      try {
        const categoria = await Categoria.findById(id);
        if (!categoria) {
          throw new Error('Categoría no encontrada');
        }
        return {
          ...categoria.toObject(),
          id: categoria._id.toString(),
          creado: categoria.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al obtener la categoría');
      }
    },
    obtenerPosts: async (_, { categoriaId }) => {
      try {
        const query = categoriaId ? { categoria: categoriaId } : {};
        const posts = await Publicacion.find(query)
          .populate('autor', 'nombre apellido')
          .populate('categoria', 'nombre');

        const postsWithRatings = await Promise.all(posts.map(async post => {
          const puntuaciones = await Puntuacion.find({ publicacion: post._id });
          const totalPuntuaciones = puntuaciones.length;
          const promedioPuntuacion = totalPuntuaciones > 0
            ? puntuaciones.reduce((sum, p) => sum + p.puntuacion, 0) / totalPuntuaciones
            : 0;
          
          return {
            ...post.toObject(),
            id: post._id.toString(),
            creado: post.creado.toISOString(),
            promedioPuntuacion,
            numeroPuntuaciones: totalPuntuaciones
          };
        }));

        return postsWithRatings;
      } catch (error) {
        console.error('Error al obtener los posts:', error.message);
        throw new Error('Error al obtener los posts');
      }
    },
    obtenerPost: async (_, { id }) => {
      try {
        const post = await Publicacion.findById(id).populate('autor').populate('categoria');
        if (!post) {
          throw new Error('Post no encontrado');
        }
        return {
          ...post.toObject(),
          id: post._id.toString(),
          creado: post.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al obtener el post');
      }
    },
    obtenerMisPosts: async (_, __, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }
      try {
        const posts = await Publicacion.find({ autor: usuario.id })
          .populate('autor', 'nombre apellido email')
          .populate('categoria', 'nombre descripcion');

        return posts.map(post => ({
          ...post.toObject(),
          id: post._id.toString(),
          creado: post.creado.toISOString(),
        }));
      } catch (error) {
        console.error('Error al obtener los posts:', error.message);
        throw new Error('Error al obtener los posts');
      }
    },
    obtenerComentarioPorPost: async (_, { postId }) => {
      const comentarios = await Comentario.find({ post: postId }).populate('autor').populate('post');
      return comentarios.map(comentario => ({
        ...comentario.toObject(),
        id: comentario._id.toString(),
        creado: comentario.creado.toISOString(),
      }));
    },
    obtenerPuntuacionesPorPublicacion: async (_, { publicacionId }) => {
      try {
        const puntuaciones = await Puntuacion.find({ publicacion: publicacionId }).populate('usuario');
        return puntuaciones.map(puntuacion => ({
          ...puntuacion.toObject(),
          id: puntuacion._id.toString(),
          creado: puntuacion.creado.toISOString(),
        }));
      } catch (error) {
        throw new Error('Error al obtener las puntuaciones');
      }
    },
    obtenerReportes: async (_, __, { usuario }) => {
      if (!usuario || usuario.rol !== 'administrador' && usuario.rol !== 'moderador') {
        throw new Error('No autorizado');
      }

      const reportes = await Reporte.find().populate('usuario').populate('publicacion');
      console.log('Reportes obtenidos de la base de datos:', reportes);

      return reportes.map(reporte => {
        if (!reporte || !reporte.usuario || !reporte.publicacion) {
          console.error('Reporte nulo o incompleto encontrado:', reporte);
          return null;
        }
        return {
          ...reporte.toObject(),
          id: reporte._id.toString(),
          usuario: {
            ...reporte.usuario.toObject(),
            id: reporte.usuario._id.toString()
          },
          publicacion: {
            ...reporte.publicacion.toObject(),
            id: reporte.publicacion._id.toString()
          },
          fechaCreacion: reporte.fechaCreacion.toISOString()
        };
      }).filter(reporte => reporte !== null);
    },
    obtenerNotificaciones: async (_, __, { usuario }) => {
      if (!usuario) {
        throw new Error('No autorizado');
      }

      const notificaciones = await Notificacion.find({ usuario: usuario.id });
      return notificaciones.map(notificacion => ({
        ...notificacion.toObject(),
        id: notificacion._id.toString(),
        fechaCreacion: notificacion.fechaCreacion.toISOString()
      }));
    },
    obtenerAnuncios: async () => {
      try {
        const anuncios = await Anuncio.find({
          fechaInicio: { $lte: new Date() },
          fechaFinal: { $gte: new Date() }
        });
        return anuncios.map(anuncio => ({
          ...anuncio.toObject(),
          id: anuncio._id.toString(),
          fechaInicio: anuncio.fechaInicio.toISOString(),
          fechaFinal: anuncio.fechaFinal.toISOString()
        }));
      } catch (error) {
        throw new Error('Error al obtener los anuncios');
      }
    }
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error('El email ya está registrado');
      }
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error('El usuario no existe');
      }
      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
      if (!passwordCorrecto) {
        throw new Error('El password es incorrecto');
      }
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h')
      };
    },
    actualizarUsuario: async (_, { id, input }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }
  
      if (usuario.rol !== 'administrador' && usuario.id !== id) {
        throw new Error('No tiene permiso para actualizar este perfil');
      }
  
      if (input.password) {
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(input.password, salt);
      }
  
      try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, input, { new: true });
        if (!usuarioActualizado) {
          throw new Error('Usuario no encontrado');
        }
        return usuarioActualizado;
      } catch (error) {
        throw new Error('Error al actualizar el usuario');
      }
    },
    actualizarRolUsuario: async (_, { id, nuevoRol }, { usuario }) => {
      if (!usuario || usuario.rol !== 'administrador') {
        console.log(usuario);
        throw new Error('Acceso denegado. Solo los administradores pueden cambiar roles.');
      }
      if (usuario.id === id) {
        throw new Error('No puedes cambiar tu propio rol.');
      }
      const rolesValidos = ['administrador', 'moderador', 'miembro'];
      if (!rolesValidos.includes(nuevoRol)) {
        throw new Error('Rol no válido. Los roles permitidos son: administrador, moderador, miembro.');
      }
      const usuarioActualizado = await Usuario.findByIdAndUpdate(id, { rol: nuevoRol }, { new: true });
      if (!usuarioActualizado) {
        throw new Error('Usuario no encontrado');
      }
      return usuarioActualizado;
    },
    crearCategoria: async (_, { input }) => {
      try {
        const categoriaExistente = await Categoria.findOne({ nombre: input.nombre });
        if (categoriaExistente) {
          throw new Error('Ya existe una categoría con ese nombre');
        }
        const categoria = new Categoria(input);
        categoria.save();
        return {
          ...categoria.toObject(),
          id: categoria._id.toString(),
          creado: categoria.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al crear la categoría');
      }
    },
    actualizarCategoria: async (_, { id, input }) => {
      try {
        const categoriaActualizada = await Categoria.findByIdAndUpdate(id, input, { new: true });
        if (!categoriaActualizada) {
          throw new Error('Categoría no encontrada');
        }
        return {
          ...categoriaActualizada.toObject(),
          id: categoriaActualizada._id.toString(),
          creado: categoriaActualizada.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al actualizar la categoría');
      }
    },
    eliminarCategoria: async (_, { id }) => {
      try {
        await Categoria.findByIdAndDelete(id);
        return "Categoría eliminada exitosamente";
      } catch (error) {
        throw new Error('Error al eliminar la categoría');
      }
    },
    crearPost: async (_, { input }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const { titulo, contenido, pdfUrl, imagenUrl, categoriaId } = input;
      try {
        const post = new Publicacion({
          titulo,
          contenido,
          pdfUrl,
          imagenUrl,
          autor: usuario.id,
          categoria: categoriaId,
        });
        await post.save();
        return {
          ...post.toObject(),
          id: post._id.toString(),
          creado: post.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al crear el post');
      }
    },
    actualizarPost: async (_, { id, input }, { usuario }) => {
      try {
        if (!usuario) {
          throw new Error('No autenticado');
        }

        const post = await Publicacion.findById(id);
        if (!post) {
          throw new Error('Post no encontrado');
        }

        if (post.autor.toString() !== usuario.id) {
          throw new Error('No tiene permiso para actualizar este post');
        }

        const postActualizado = await Publicacion.findByIdAndUpdate(id, input, { new: true });

        return {
          ...postActualizado.toObject(),
          id: postActualizado._id.toString(),
          creado: postActualizado.creado.toISOString(),
        };
      } catch (error) {
        console.error('Error al actualizar el post:', error.message);
        throw new Error('Error al actualizar el post');
      }
    },
    eliminarPost: async (_, { id }, { usuario }) => {
      try {
        if (!usuario) {
          throw new Error('No autenticado');
        }

        const post = await Publicacion.findById(id);
        if (!post) {
          throw new Error('Post no encontrado o ya eliminado');
        }

        if (post.autor.toString() !== usuario.id) {
          throw new Error('No tiene permiso para eliminar este post');
        }

        await Publicacion.findByIdAndDelete(id);
        return `Post con ID: ${id} ha sido eliminado exitosamente`;
      } catch (error) {
        console.error('Error al eliminar el post:', error.message);
        throw new Error('Error al eliminar el post');
      }
    },
    crearComentario: async (_, { input }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const comentario = new Comentario({
        contenido: input.contenido,
        post: input.postId,
        autor: usuario.id
      });

      await comentario.save();

      const comentarioCreado = await Comentario.findById(comentario._id)
        .populate({
          path: 'post',
          populate: {
            path: 'autor',
            select: 'nombre apellido'
          }
        })
        .populate({
          path: 'autor',
          select: 'nombre apellido'
        });

      return {
        ...comentarioCreado.toObject(),
        id: comentarioCreado._id.toString(),
        creado: comentarioCreado.creado.toISOString(),
      };
    },
    actualizarComentario: async (_, { id, input }, { usuarioId }) => {
      const comentario = await Comentario.findById(id);
      if (!comentario) {
        throw new Error('Comentario no encontrado');
      }
      if (comentario.autor.toString() !== usuarioId) {
        throw new Error('No tiene permiso para actualizar este comentario');
      }
      if (input.contenido) comentario.contenido = input.contenido;
      await comentario.save();
      const comentarioActualizado = await Comentario.findById(id);
      return {
        mensaje: "Comentario actualizado exitosamente",
        comentario: {
          ...comentarioActualizado.toObject(),
          id: comentarioActualizado._id.toString(),
          creado: comentarioActualizado.creado.toISOString(),
        },
      };
    },
    eliminarComentario: async (_, { id }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const comentario = await Comentario.findById(id);
      if (!comentario) {
        throw new Error('Comentario no encontrado');
      }

      if (comentario.autor.toString() !== usuario.id) {
        throw new Error('No tiene permiso para eliminar este comentario');
      }

      await Comentario.findByIdAndDelete(id);
      return "Comentario eliminado exitosamente";
    },
    crearPuntuacion: async (_, { input }, { usuario }) => {
      console.log('Crear Puntuacion Input:', input);
      console.log('Usuario:', usuario);

      if (!usuario) {
        throw new Error('No autenticado');
      }

      const { publicacionId, puntuacion } = input;

      try {
        const puntuacionExistente = await Puntuacion.findOne({ publicacion: publicacionId, usuario: usuario.id });
        if (puntuacionExistente) {
          throw new Error('Ya has puntuado esta publicación');
        }

        const nuevaPuntuacion = new Puntuacion({
          publicacion: publicacionId,
          usuario: usuario.id,
          puntuacion
        });

        await nuevaPuntuacion.save();
        return {
          ...nuevaPuntuacion.toObject(),
          id: nuevaPuntuacion._id.toString(),
          creado: nuevaPuntuacion.creado.toISOString(),
        };
      } catch (error) {
        console.error('Error al crear la puntuación:', error);
        throw new Error('Error al crear la puntuación');
      }
    },
    actualizarPuntuacion: async (_, { input }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const { puntuacionId, puntuacion } = input;
      const puntuacionExistente = await Puntuacion.findById(puntuacionId);

      if (!puntuacionExistente) {
        throw new Error('La puntuación no existe');
      }

      if (puntuacionExistente.usuario.toString() !== usuario.id) {
        throw new Error('No tiene permiso para modificar esta puntuación');
      }

      puntuacionExistente.puntuacion = puntuacion;

      try {
        await puntuacionExistente.save();
        const puntuacionActualizada = await Puntuacion.findById(puntuacionId);
        return {
          ...puntuacionActualizada.toObject(),
          id: puntuacionActualizada._id.toString(),
          creado: puntuacionActualizada.creado.toISOString(),
        };
      } catch (error) {
        throw new Error('Error al actualizar la puntuación');
      }
    },
    reportarPublicacion: async (_, { input }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      try {
        const reporteExistente = await Reporte.findOne({ usuario: usuario.id, publicacion: input.publicacionId });
        if (reporteExistente) {
          throw new Error('Ya has reportado esta publicación.');
        }

        const reporte = new Reporte({
          usuario: usuario.id,
          publicacion: input.publicacionId,
          motivo: input.motivo,
        });

        await reporte.save();

        return {
          success: true,
          message: 'Publicación reportada exitosamente.',
        };
      } catch (error) {
        console.error('Error en la mutación reportarPublicacion:', error);
        throw new Error(`Error al reportar la publicación: ${error.message}`);
      }
    },
    actualizarEstadoReporte: async (_, { input }, { usuario }) => {
      const { reporteId, estado } = input;

      if (!usuario || usuario.rol !== 'administrador' && usuario.rol !== 'moderador') {
        throw new Error('No autorizado');
      }

      const reporte = await Reporte.findById(reporteId).populate('usuario').populate('publicacion');
      if (!reporte) {
        throw new Error('Reporte no encontrado');
      }

      reporte.estado = estado;
      await reporte.save();

      let mensaje;
      if (estado === 'revisado') {
        await Publicacion.findByIdAndDelete(reporte.publicacion._id);
        mensaje = 'El reporte ha sido revisado y se procedió a eliminar la publicación';
      } else if (estado === 'rechazado') {
        mensaje = 'El reporte ha sido rechazado';
      }

      if (mensaje) {
        const notificacion = new Notificacion({
          usuario: reporte.usuario._id,
          mensaje
        });
        await notificacion.save();
      }

      return {
        success: true,
        message: `Reporte ${estado} exitosamente.`
      };
    },
    marcarNotificacionComoLeida: async (_, { id }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const notificacion = await Notificacion.findById(id);
      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      if (notificacion.usuario.toString() !== usuario.id) {
        throw new Error('No autorizado');
      }

      notificacion.leido = true;
      await notificacion.save();
      return notificacion;
    },
    eliminarNotificacion: async (_, { id }, { usuario }) => {
      if (!usuario) {
        throw new Error('No autenticado');
      }

      const notificacion = await Notificacion.findById(id);
      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      if (notificacion.usuario.toString() !== usuario.id) {
        throw new Error('No tiene permiso para eliminar esta notificación');
      }

      await Notificacion.findByIdAndDelete(id);
      return "Notificación eliminada exitosamente";
    },
    crearAnuncio: async (_, { input }, { usuario }) => {
      if (!usuario || usuario.rol !== 'administrador') {
        throw new Error('No autorizado');
      }
      try {
        const anuncio = new Anuncio({
          ...input,
          fechaInicio: new Date(input.fechaInicio),
          fechaFinal: new Date(input.fechaFinal)
        });
        await anuncio.save();
        return {
          ...anuncio.toObject(),
          id: anuncio._id.toString(),
          fechaInicio: anuncio.fechaInicio.toISOString(),
          fechaFinal: anuncio.fechaFinal.toISOString()
        };
      } catch (error) {
        throw new Error('Error al crear el anuncio');
      }
    },
    actualizarAnuncio: async (_, { id, input }, { usuario }) => {
      if (!usuario || usuario.rol !== 'administrador') {
        throw new Error('No autorizado');
      }
      try {
        const anuncio = await Anuncio.findByIdAndUpdate(id, input, { new: true });
        if (!anuncio) {
          throw new Error('Anuncio no encontrado');
        }
        return anuncio;
      } catch (error) {
        throw new Error('Error al actualizar el anuncio');
      }
    },
    eliminarAnuncio: async (_, { id }, { usuario }) => {
      if (!usuario || usuario.rol !== 'administrador') {
        throw new Error('No autorizado');
      }
      try {
        await Anuncio.findByIdAndDelete(id);
        return "Anuncio eliminado exitosamente";
      } catch (error) {
        throw new Error('Error al eliminar el anuncio');
      }
    }
  }
}

module.exports = {
  resolvers,
  eliminarAnunciosCaducados
};