const err = { description: 'Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const auth = [{ bearerAuth: [] }];
const taskBody = (required) => ({
  required: true,
  content: { 'application/json': { schema: { $ref: required ? '#/components/schemas/TaskCreate' : '#/components/schemas/TaskUpdate' } } },
});
const taskRes = (d) => ({ description: d, content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } });
const q = (name, schema, description) => ({ name, in: 'query', schema, description });
const json = (schema) => ({ required: true, content: { 'application/json': { schema } } });

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Task Management API', version: '1.0.0', description: 'REST API for managing tasks with JWT authentication.' },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'array', items: { type: 'object' } } } },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          category: { type: 'string', nullable: true }, dueDate: { type: 'string', format: 'date', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          userId: { type: 'integer' }, createdAt: { type: 'string' }, updatedAt: { type: 'string' },
        },
      },
      TaskCreate: {
        type: 'object', required: ['title'],
        properties: {
          title: { type: 'string', maxLength: 200, example: 'Finish report' },
          description: { type: 'string', example: 'Q3 numbers' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          category: { type: 'string', example: 'Work' },
          dueDate: { type: 'string', format: 'date', example: '2026-10-15' },
        },
      },
      TaskUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' }, description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          category: { type: 'string' }, dueDate: { type: 'string', format: 'date' },
        },
      },
    },
  },
  paths: {
    '/auth/register': { post: { tags: ['Auth'], summary: 'Register a user',
      requestBody: json({ type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 } } }),
      responses: { 201: { description: 'Created; returns user and token' }, 409: err, 422: err } } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Log in',
      requestBody: json({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } }),
      responses: { 200: { description: 'Returns user and token' }, 401: err, 422: err } } },
    '/tasks': {
      get: { tags: ['Tasks'], summary: 'List/search/filter tasks', security: auth,
        parameters: [
          q('status', { type: 'string', enum: ['pending', 'completed'] }, 'Filter by completion status'),
          q('priority', { type: 'string', enum: ['low', 'medium', 'high'] }), q('category', { type: 'string' }),
          q('search', { type: 'string' }, 'Matches title or description'),
          q('dueBefore', { type: 'string', format: 'date' }), q('dueAfter', { type: 'string', format: 'date' }),
          q('sortBy', { type: 'string', enum: ['createdAt', 'dueDate', 'priority', 'title'] }),
          q('order', { type: 'string', enum: ['asc', 'desc'] }), q('page', { type: 'integer' }), q('limit', { type: 'integer' }),
        ],
        responses: { 200: { description: 'Paginated tasks' }, 401: err, 422: err } },
      post: { tags: ['Tasks'], summary: 'Create a task', security: auth, requestBody: taskBody(true),
        responses: { 201: taskRes('Created'), 401: err, 422: err } },
    },
    '/tasks/{id}': {
      get: { tags: ['Tasks'], summary: 'Get a task', security: auth, parameters: [idParam],
        responses: { 200: taskRes('OK'), 401: err, 404: err, 422: err } },
      put: { tags: ['Tasks'], summary: 'Update a task', security: auth, parameters: [idParam], requestBody: taskBody(false),
        responses: { 200: taskRes('Updated'), 401: err, 404: err, 422: err } },
      patch: { tags: ['Tasks'], summary: 'Partially update a task', security: auth, parameters: [idParam], requestBody: taskBody(false),
        responses: { 200: taskRes('Updated'), 401: err, 404: err, 422: err } },
      delete: { tags: ['Tasks'], summary: 'Delete a task', security: auth, parameters: [idParam],
        responses: { 204: { description: 'Deleted' }, 401: err, 404: err, 422: err } },
    },
    '/tasks/{id}/status': { patch: { tags: ['Tasks'], summary: 'Mark completed or pending', security: auth, parameters: [idParam],
      requestBody: json({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'completed'] } } }),
      responses: { 200: taskRes('Updated'), 401: err, 404: err, 422: err } } },
  },
};
