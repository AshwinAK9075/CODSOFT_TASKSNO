# Student Record Management API

A REST API for managing students, courses and enrollments, built with **Express.js**, **Sequelize** and **SQLite** (switchable to PostgreSQL through one environment variable).

---

## 1. Quick start

```bash
npm install          # install dependencies
cp .env.example .env # optional — defaults work as-is
npm run seed         # create tables + sample data (drops existing tables)
npm run dev          # start with auto-reload, or: npm start
```

The API is then available at `http://localhost:3000/api/v1`.
`GET /api/v1` lists every endpoint; `GET /api/v1/health` reports database connectivity.

To use PostgreSQL instead, set `DB_DIALECT=postgres` plus the `DB_*` credentials in `.env`.

---

## 2. Project structure

```
src/
├── config/
│   ├── env.js            # all environment configuration, read in one place
│   └── database.js       # Sequelize connection + schema sync
├── models/
│   ├── student.model.js  # Student entity
│   ├── course.model.js   # Course entity
│   ├── enrollment.model.js
│   └── index.js          # model registry + associations
├── validators/           # express-validator rule sets per resource
├── middleware/
│   ├── validate.js       # turns validation failures into 422 responses
│   └── errorHandler.js   # 404 handler + single central error handler
├── controllers/          # request handling and business rules
├── routes/               # URL → controller mapping
├── utils/
│   ├── ApiError.js       # error type carrying an HTTP status
│   ├── asyncHandler.js   # async → Express error pipeline
│   └── queryFeatures.js  # search / filter / sort / pagination
├── app.js                # Express app assembly
├── server.js             # bootstrap + graceful shutdown
└── seed.js               # sample dataset
```

Each layer has one job: routes map URLs, validators guard input, controllers hold business rules, models own persistence.

---

## 3. Database design

```
┌──────────────┐        ┌──────────────────┐        ┌─────────────┐
│   students   │ 1    N │   enrollments    │ N    1 │   courses   │
├──────────────┤────────├──────────────────┤────────├─────────────┤
│ id (PK)      │        │ id (PK)          │        │ id (PK)     │
│ rollNumber ∪ │        │ studentId (FK)   │        │ code ∪      │
│ firstName    │        │ courseId  (FK)   │        │ title       │
│ lastName     │        │ semester         │        │ description │
│ email ∪      │        │ enrolledOn       │        │ credits     │
│ phone        │        │ status           │        │ department  │
│ dateOfBirth  │        │ grade            │        │ instructor  │
│ department   │        │ createdAt/…      │        │ capacity    │
│ status       │        └──────────────────┘        │ status      │
│ createdAt/…  │                                    │ createdAt/… │
└──────────────┘                                    └─────────────┘
        ∪ = unique constraint
```

`Enrollment` is a join table with its own attributes, which makes Students ↔ Courses a
many-to-many relationship that can also record *semester*, *status* and *grade*.

**Constraints**

| Constraint | Effect |
|---|---|
| `students.rollNumber`, `students.email` unique | no duplicate student records |
| `courses.code` unique | no duplicate course codes |
| `(studentId, courseId, semester)` unique | a student cannot enroll twice in one course per semester |
| FK `ON DELETE CASCADE` | deleting a student or course removes its enrollments |
| model-level check | a `grade` may only exist when `status = 'completed'` |

**Enumerations** — student `status`: `active`, `inactive`, `graduated` · course `status`: `open`, `closed`, `archived` · enrollment `status`: `enrolled`, `completed`, `dropped` · `grade`: `A`–`F`.

---

## 4. Response format

Success (single resource):

```json
{ "success": true, "data": { "id": 1, "rollNumber": "4MT22CS001", "...": "..." } }
```

Success (collection) — always paginated:

```json
{
  "success": true,
  "data": [ { "id": 1 }, { "id": 2 } ],
  "meta": {
    "totalItems": 42, "itemsPerPage": 10, "currentPage": 1,
    "totalPages": 5, "hasNextPage": true, "hasPreviousPage": false
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "status": 422,
    "message": "Validation failed",
    "details": [ { "field": "email", "value": "abc", "message": "email must be a valid address" } ]
  }
}
```

---

## 5. Endpoints

### Students

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/v1/students` | list (search, filter, sort, paginate) | 200 |
| GET | `/api/v1/students/:id` | one student with enrollments | 200 |
| GET | `/api/v1/students/:id/courses` | courses the student is enrolled in | 200 |
| POST | `/api/v1/students` | create | 201 |
| PUT / PATCH | `/api/v1/students/:id` | update (partial allowed) | 200 |
| DELETE | `/api/v1/students/:id` | delete (enrollments cascade) | 204 |

### Courses

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/v1/courses` | list | 200 |
| GET | `/api/v1/courses/:id` | one course + `enrolledCount`, `seatsAvailable` | 200 |
| GET | `/api/v1/courses/:id/students` | course roster | 200 |
| POST | `/api/v1/courses` | create | 201 |
| PUT / PATCH | `/api/v1/courses/:id` | update | 200 |
| DELETE | `/api/v1/courses/:id` | delete | 204 |

### Enrollments

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/v1/enrollments` | list with student + course embedded | 200 |
| GET | `/api/v1/enrollments/:id` | one enrollment | 200 |
| POST | `/api/v1/enrollments` | enroll a student in a course | 201 |
| PUT / PATCH | `/api/v1/enrollments/:id` | record status / grade / semester | 200 |
| DELETE | `/api/v1/enrollments/:id` | remove enrollment | 204 |

---

## 6. Search, filtering, sorting, pagination

Every list endpoint accepts the same query parameters.

| Parameter | Example | Notes |
|---|---|---|
| `search` | `?search=anita` | case-insensitive partial match across the resource's text fields |
| `<field>` | `?status=active&department=Electronics` | exact match |
| `<field>` (multi) | `?status=active,graduated` | matches any of the listed values |
| `<field>[op]` | `?credits[gte]=3&credits[lt]=5` | range operators: `gt`, `gte`, `lt`, `lte`, `ne` |
| `sort` | `?sort=-createdAt,lastName` | comma-separated; `-` prefix means descending |
| `page` | `?page=2` | 1-based, default `1` |
| `limit` | `?limit=25` | default `10`, capped at `MAX_PAGE_SIZE` (100) |

Searchable / filterable / sortable fields are allow-listed per resource in the controllers,
so a client can never filter or sort by an unexpected column.

| Resource | Searchable | Filterable | Sortable |
|---|---|---|---|
| Students | firstName, lastName, email, rollNumber | status, department, rollNumber, email | id, firstName, lastName, rollNumber, department, status, createdAt, updatedAt |
| Courses | code, title, description, instructor | department, credits, status, instructor, code | id, code, title, credits, capacity, department, status, createdAt |
| Enrollments | — | studentId, courseId, status, semester, grade | id, studentId, courseId, enrolledOn, status, grade, createdAt |

Examples:

```
GET /api/v1/students?search=rao&status=active&sort=lastName&page=1&limit=5
GET /api/v1/courses?department=Computer%20Science&credits[gte]=4&sort=-credits
GET /api/v1/enrollments?studentId=1&status=enrolled&sort=-enrolledOn
```

---

## 7. Validation

Requests are validated **before** any database call, by `express-validator` rule sets in
`src/validators/`. A failure returns `422` with the offending field, value and reason —
never a partial write.

Examples of what is enforced:

* `rollNumber` — 3–20 letters, digits or hyphens, unique
* `email` — valid address, normalised, unique
* `phone` — 7–20 digits, optional `+` prefix
* `dateOfBirth` — ISO date, in the past, implied age between 10 and 100
* `code` (course) — pattern `CS101` (2–4 letters + 3 digits)
* `credits` 1–12, `capacity` 1–1000
* `status` / `grade` — must be one of the allowed enum values
* update requests must contain at least one field
* `studentId` / `courseId` cannot be changed on an existing enrollment

Database-level errors are also mapped to clean responses: a unique-constraint violation
becomes `409`, a model validation error `422`, a bad foreign key `400`.

---

## 8. Business rules on enrollment

`POST /api/v1/enrollments` runs inside a transaction and rejects the request when:

| Situation | Status |
|---|---|
| student or course does not exist | 404 |
| student is not `active` | 409 |
| course is not `open` | 409 |
| the course is already at capacity | 409 |
| the student is already enrolled in that course for that semester | 409 |

Reducing a course's `capacity` below the number of currently enrolled students returns `400`.
Setting an enrollment to `dropped` clears any recorded grade.

---

## 9. HTTP status codes used

| Code | When |
|---|---|
| 200 OK | successful read or update |
| 201 Created | resource created (`Location` header points at it) |
| 204 No Content | successful delete |
| 400 Bad Request | malformed query, unsupported filter operator, invalid capacity change |
| 404 Not Found | unknown id or unknown route |
| 409 Conflict | duplicate record or a violated enrollment rule |
| 422 Unprocessable Entity | input validation failure |
| 500 / 503 | unexpected server error / database unreachable |

---

## 10. Try it

```bash
# create a student
curl -X POST http://localhost:3000/api/v1/students \
  -H "Content-Type: application/json" \
  -d '{"rollNumber":"4MT22CS099","firstName":"Nikhil","lastName":"Rai",
       "email":"nikhil.rai@example.edu","department":"Computer Science",
       "dateOfBirth":"2004-05-14"}'

# search + sort + paginate
curl "http://localhost:3000/api/v1/students?search=rai&sort=-createdAt&limit=5"

# enroll that student in CS201 (id 2 after seeding)
curl -X POST http://localhost:3000/api/v1/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId":6,"courseId":2,"semester":"2025-ODD"}'

# record completion and a grade
curl -X PATCH http://localhost:3000/api/v1/enrollments/7 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","grade":"A"}'

# a deliberate validation failure → 422
curl -X POST http://localhost:3000/api/v1/students \
  -H "Content-Type: application/json" -d '{"email":"not-an-email"}'
```

---

## 11. Possible extensions

Authentication with JWT and role-based access (student / faculty / admin), automated tests
with Jest and Supertest, rate limiting and `helmet`, versioned Sequelize migrations instead
of `sync()`, and OpenAPI/Swagger documentation served from the API itself.
