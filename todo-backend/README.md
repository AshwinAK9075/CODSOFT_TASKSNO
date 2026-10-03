# Task Management Backend

Express + Sequelize (SQLite) REST API with JWT auth, validation, and Swagger docs.

## Run
```bash
npm install
cp .env.example .env     # set a strong JWT_SECRET
npm run dev
```
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON (import into Postman via *Import > Link*): http://localhost:3000/openapi.json

## Structure
```
src/
  config/       database connection
  models/       User, Task (+ associations)
  validators/   express-validator rules
  middleware/   auth (JWT), validate, errorHandler
  controllers/  business logic
  routes/       URL -> controller mapping
  docs/         OpenAPI spec
```

## Endpoints
| Method | Path | Description | Success |
|---|---|---|---|
| POST | /api/auth/register | Create account | 201 |
| POST | /api/auth/login | Get JWT | 200 |
| GET | /api/tasks | List, search, filter, sort, paginate | 200 |
| POST | /api/tasks | Create task | 201 |
| GET | /api/tasks/:id | Get task | 200 |
| PUT/PATCH | /api/tasks/:id | Update task | 200 |
| PATCH | /api/tasks/:id/status | Mark `completed` / `pending` | 200 |
| DELETE | /api/tasks/:id | Delete task | 204 |

Errors: 400 malformed JSON, 401 missing/invalid token or bad credentials, 404 not found (or not yours), 409 duplicate email, 422 validation failure, 500 server error.

Task list query params: `status`, `priority`, `category`, `search`, `dueBefore`, `dueAfter`, `sortBy`, `order`, `page`, `limit`.

## Quick test
```bash
curl -X POST localhost:3000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Asha","email":"asha@example.com","password":"password123"}'
# use the returned token:
curl -X POST localhost:3000/api/tasks -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Finish report","priority":"high","category":"Work","dueDate":"2026-10-15"}'
curl "localhost:3000/api/tasks?status=pending&search=report" -H "Authorization: Bearer $TOKEN"
```

## Security notes
Passwords are bcrypt-hashed (never returned), all queries are parameterised by Sequelize, every task query is scoped to the authenticated user, helmet sets secure headers, and request bodies are size-limited.
