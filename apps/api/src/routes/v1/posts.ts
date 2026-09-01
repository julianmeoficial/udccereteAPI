import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  CategorySchema,
  CreatePostSchema,
  IdParamSchema,
  PaginatedResponseSchema,
  PostSchema,
  PostsQuerySchema,
  PostSummarySchema,
  SlugParamSchema,
  SuccessResponseSchema,
  TagSchema,
  UpdatePostSchema,
} from '@udccerete/schemas';
import { ok, created, okPaginated } from '../../lib/envelope.js';
import { apiErrorJson } from '../../lib/openapi-responses.js';
import { resolvePostsListQuery } from '../../lib/posts-query.js';
import { requireInstitutionalEmail, requirePermission } from '../../lib/permissions.js';
import { getUser } from '../../middleware/auth.js';
import { requireDatabase } from '../../middleware/database.js';
import type { AppBindings } from '../../types.js';
import {
  archivePost,
  createPost,
  getPostBySlug,
  listCategories,
  listPosts,
  listTags,
  updatePost,
} from '../../services/posts.js';

const listPostsRoute = createRoute({
  method: 'get',
  path: '/posts',
  tags: ['Posts'],
  summary: 'Listar publicaciones',
  request: { query: PostsQuerySchema },
  responses: {
    200: {
      description: 'Publicaciones paginadas',
      content: { 'application/json': { schema: PaginatedResponseSchema(PostSummarySchema, 'PostsListResponse') } },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const getPostRoute = createRoute({
  method: 'get',
  path: '/posts/{slug}',
  tags: ['Posts'],
  summary: 'Obtener publicación por slug',
  request: { params: SlugParamSchema },
  responses: {
    200: {
      description: 'Publicación',
      content: { 'application/json': { schema: SuccessResponseSchema(PostSchema, 'PostResponse') } },
    },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const createPostRoute = createRoute({
  method: 'post',
  path: '/posts',
  tags: ['Posts'],
  summary: 'Crear publicación',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreatePostSchema } } } },
  responses: {
    201: {
      description: 'Publicación creada',
      content: { 'application/json': { schema: SuccessResponseSchema(PostSchema, 'PostResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso o correo no institucional', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const updatePostRoute = createRoute({
  method: 'patch',
  path: '/posts/{id}',
  tags: ['Posts'],
  summary: 'Actualizar publicación',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdatePostSchema } } },
  },
  responses: {
    200: {
      description: 'Publicación actualizada',
      content: { 'application/json': { schema: SuccessResponseSchema(PostSchema, 'PostResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const archivePostRoute = createRoute({
  method: 'post',
  path: '/posts/{id}/archive',
  tags: ['Posts'],
  summary: 'Archivar publicación',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Publicación archivada',
      content: { 'application/json': { schema: SuccessResponseSchema(PostSchema, 'PostResponse') } },
    },
    401: { description: 'No autenticado', content: apiErrorJson },
    403: { description: 'Sin permiso', content: apiErrorJson },
    404: { description: 'No encontrada', content: apiErrorJson },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const listCategoriesRoute = createRoute({
  method: 'get',
  path: '/categories',
  tags: ['Posts'],
  summary: 'Listar categorías',
  responses: {
    200: {
      description: 'Categorías',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(CategorySchema.array(), 'CategoriesResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

const listTagsRoute = createRoute({
  method: 'get',
  path: '/tags',
  tags: ['Posts'],
  summary: 'Listar etiquetas',
  responses: {
    200: {
      description: 'Etiquetas',
      content: {
        'application/json': {
          schema: SuccessResponseSchema(TagSchema.array(), 'TagsResponse'),
        },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerPostsRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/posts', requireDatabase);
  app.use('/categories', requireDatabase);
  app.use('/tags', requireDatabase);

  app.openapi(listPostsRoute, async (c) => {
    const query = c.req.valid('query');
    const effectiveQuery = resolvePostsListQuery(query, c.get('user'));
    const { items, pagination } = await listPosts(effectiveQuery);
    return okPaginated(c, items, pagination);
  });

  app.openapi(getPostRoute, async (c) => {
    const { slug } = c.req.valid('param');
    const post = await getPostBySlug(slug);
    return ok(c, post);
  });

  app.openapi(listCategoriesRoute, async (c) => ok(c, await listCategories()));

  app.openapi(listTagsRoute, async (c) => ok(c, await listTags()));

  app.openapi(createPostRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'publish_post');
    requireInstitutionalEmail(user.email);
    const body = c.req.valid('json');
    const post = await createPost(user.sub, body);
    return created(c, post);
  });

  app.openapi(updatePostRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'publish_post');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const post = await updatePost(id, body);
    return ok(c, post);
  });

  app.openapi(archivePostRoute, async (c) => {
    const user = getUser(c);
    requirePermission(user.role, 'publish_post');
    const { id } = c.req.valid('param');
    const post = await archivePost(id);
    return ok(c, post);
  });
}
