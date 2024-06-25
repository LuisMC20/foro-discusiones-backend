const { gql } = require('apollo-server');

const typeDefs = gql`
  type Usuario {
    id: ID!
    nombre: String
    apellido: String
    email: String
    password: String
    celular: String
    pais: String
    ciudad: String
    rubro: String
    creado: String
    rol: String
  }

  type Token {
    token: String
  }

  type Categoria {
    id: ID!
    nombre: String
    descripcion: String
    creado: String
  }

  type Post {
    id: ID!
    titulo: String
    contenido: String
    pdfUrl: String
    imagenUrl: String
    autor: Usuario
    categoria: Categoria
    creado: String
    promedioPuntuacion: Float
    numeroPuntuaciones: Int
  }

  type Puntuacion {
    id: ID!
    publicacion: Post!
    usuario: Usuario!
    puntuacion: Int!
    creado: String!
  }

  type Comentario {
    id: ID!
    contenido: String!
    post: Post!
    autor: Usuario!
    creado: String!
  }

  type Reporte {
    id: ID!
    usuario: Usuario!
    publicacion: Post!
    motivo: String!
    estado: String!
    fechaCreacion: String!
  }

  type Notificacion {
    id: ID!
    usuario: Usuario!
    mensaje: String!
    leido: Boolean!
    fechaCreacion: String!
  }

  type ReporteRespuesta {
    success: Boolean!
    message: String!
  }

  type Anuncio {
    id: ID!
    titulo: String!
    contenido: String!
    imagenUrl: String
    fechaInicio: String!
    fechaFinal: String!
    creado: String
  }

  input UsuarioInput {
    nombre: String!
    apellido: String!
    password: String!
    email: String!
    celular: String!
    pais: String!
    ciudad: String!
    rubro: String!
    rol: String
  }

  input ActualizarUsuarioInput {
    nombre: String
    apellido: String
    email: String
    password: String
    celular: String
    pais: String
    ciudad: String
    rubro: String
  }

  input AutenticarInput {
    email: String!
    password: String!
  }

  input CategoriaInput {
    nombre: String!
    descripcion: String!
  }

  input CategoriaUpdateInput {
    nombre: String
    descripcion: String
  }

  input PostInput {
    titulo: String!
    contenido: String!
    pdfUrl: String
    imagenUrl: String
    categoriaId: ID!
  }

  input PostUpdateInput {
    titulo: String
    contenido: String
    pdfUrl: String
    imagenUrl: String
    categoriaId: ID
  }

  input ComentarioInput {
    contenido: String!
    postId: ID!
    autorId: ID!
  }

  input UpdateComentarioInput {
    contenido: String
  }

  input CrearPuntuacionInput {
    publicacionId: ID!
    puntuacion: Int!
  }

  input ActualizarPuntuacionInput {
    puntuacionId: ID!
    puntuacion: Int!
  }

  input ReportarPublicacionInput {
    publicacionId: ID!
    motivo: String!
  }

  input ActualizarEstadoReporteInput {
    reporteId: ID!
    estado: String!
  }

  input AnuncioInput {
    titulo: String!
    contenido: String!
    imagenUrl: String
    fechaInicio: String!
    fechaFinal: String!
  }

  type Query {
    obtenerUsuario: Usuario
    obtenerUsuarios: [Usuario]
    obtenerCategorias: [Categoria]
    obtenerCategoria(id: ID!): Categoria
    obtenerPosts(categoriaId: ID): [Post]
    obtenerPost(id: ID!): Post
    obtenerMisPosts: [Post]
    obtenerComentarioPorPost(postId: ID!): [Comentario]
    obtenerPuntuacionesPorPublicacion(publicacionId: ID!): [Puntuacion]
    obtenerReportes: [Reporte]
    obtenerNotificaciones: [Notificacion]
    obtenerAnuncios: [Anuncio]
  }

  type Mutation {
    nuevoUsuario(input: UsuarioInput): Usuario
    actualizarRolUsuario(id: ID!, nuevoRol: String!): Usuario
    autenticarUsuario(input: AutenticarInput): Token
    actualizarUsuario(id: ID!, input: ActualizarUsuarioInput): Usuario
    crearCategoria(input: CategoriaInput): Categoria
    actualizarCategoria(id: ID!, input: CategoriaUpdateInput): Categoria
    eliminarCategoria(id: ID!): String
    crearPost(input: PostInput): Post
    actualizarPost(id: ID!, input: PostUpdateInput): Post
    eliminarPost(id: ID!): String
    crearComentario(input: ComentarioInput): Comentario
    actualizarComentario(id: ID!, input: UpdateComentarioInput): Comentario
    eliminarComentario(id: ID!): String
    crearPuntuacion(input: CrearPuntuacionInput): Puntuacion
    actualizarPuntuacion(input: ActualizarPuntuacionInput): Puntuacion
    reportarPublicacion(input: ReportarPublicacionInput): ReporteRespuesta
    actualizarEstadoReporte(input: ActualizarEstadoReporteInput): ReporteRespuesta
    marcarNotificacionComoLeida(id: ID!): Notificacion
    eliminarNotificacion(id: ID!): String
    crearAnuncio(input: AnuncioInput): Anuncio
    actualizarAnuncio(id: ID!, input: AnuncioInput): Anuncio
    eliminarAnuncio(id: ID!): String
  }
`;

module.exports = typeDefs;
