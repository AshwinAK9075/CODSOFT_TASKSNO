# CodSoft Backend Tasks

Backend development tasks built with Node.js, Express.js and Sequelize.

| Task | Project | Folder |
|---|---|---|
| 1 | Student Record Management API | [`Task-1-Student-Records-API`](./Task-1-Student-Records-API) |
| 2 | Task Management (To-Do List) API | [`todo-backend`](./todo-backend) |

---

## Task 1: Student Record Management API

A REST API for managing students, courses and enrollments.

**Features**
- CRUD operations for students, courses and enrollments
- Relational models linked through enrollments
- Request validation and proper HTTP status codes
- Search, filter, sort and pagination
- Modular code structure (routes, controllers, models, validators)

**Run it**
```bash
cd Task-1-Student-Records-API
npm install
cp .env.example .env
npm run dev
```
See the README inside the folder for the endpoint list.

---

## Task 2: Task Management (To-Do List) API

A REST API for managing tasks, with JWT authentication and Swagger documentation.

**Features**
- Add, update, delete and retrieve tasks
- Mark tasks as `completed` or `pending`
- Search and filter by status, priority, category and due date
- Pagination and sorting
- Validation on every request, with correct HTTP status codes
- User registration and login with JWT; each user sees only their own tasks
- Due dates, priority levels and categories
- Swagger documentation at `/api-docs`

**Tech stack:** Node.js, Express, Sequelize, SQLite, JWT, bcrypt, express-validator, Swagger UI

**Run it**
```bash
cd todo-backend
npm install
cp .env.example .env     # set a strong JWT_SECRET
npm run dev
```
Then open http://localhost:3000/api-docs

**Main endpoints**

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create an account |
| POST | /api/auth/login | Log in and get a token |
| GET | /api/tasks | List, search and filter tasks |
| POST | /api/tasks | Create a task |
| GET | /api/tasks/:id | Get one task |
| PUT/PATCH | /api/tasks/:id | Update a task |
| PATCH | /api/tasks/:id/status | Mark completed or pending |
| DELETE | /api/tasks/:id | Delete a task |

---

## Requirements
- Node.js 18 or later
- npm

## Author
Ashwin