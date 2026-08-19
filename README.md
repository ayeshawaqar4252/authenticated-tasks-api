# Authenticated Tasks API

A modular NestJS REST API for managing projects and tasks with JWT authentication, PostgreSQL, TypeORM, DTO validation, authorization, and automated tests.

## Features

* User registration and login
* Password hashing with bcrypt
* JWT-based authentication
* Protected project and task write routes
* Authenticated user resolution with `@CurrentUser`
* Project and task CRUD operations
* Task filtering by status, project, and assignee
* DTO validation with `class-validator`
* Global validation pipe
* Global HTTP exception filter
* PostgreSQL database with TypeORM
* Database migrations with `synchronize: false`
* CORS enabled for Next.js development
* Unit and end-to-end tests

## Tech Stack

* NestJS
* TypeScript
* PostgreSQL
* TypeORM
* JWT
* Passport
* bcrypt
* class-validator
* class-transformer
* Jest
* Supertest

## Project Structure

```text
src/
├── auth/
│   ├── dto/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── users/
│   ├── users.service.ts
│   └── users.controller.ts
├── projects/
│   ├── projects.controller.ts
│   └── projects.service.ts
├── tasks/
│   ├── dto/
│   ├── tasks.controller.ts
│   └── tasks.service.ts
├── entities/
├── common/
│   └── http-exception.filter.ts
├── data-source.ts
├── app.module.ts
└── main.ts

test/
└── app.e2e-spec.ts
```

## Project Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root.

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=task_manager_week7

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1h
```

### Environment variable description

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `DB_HOST`        | PostgreSQL host                |
| `DB_PORT`        | PostgreSQL port                |
| `DB_USERNAME`    | PostgreSQL username            |
| `DB_PASSWORD`    | PostgreSQL password            |
| `DB_DATABASE`    | Week 7 Task Manager database   |
| `JWT_SECRET`     | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | JWT token expiry duration      |

Do not commit the `.env` file or real credentials to Git.

## Database

This API reuses the Week 7 PostgreSQL database and entities.

TypeORM synchronization is disabled:

```text
synchronize: false
```

The database schema is managed through migrations.

Run migrations with:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

## Run the Application

Development mode:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
```

Production mode:

```bash
npm run start:prod
```

The API runs on:

```text
http://localhost:3000
```

CORS allows the Next.js development origin:

```text
http://localhost:3000
```

## Authentication

### 1. Register

**POST** `/auth/register`

Request:

```json
{
  "name": "Ayesha",
  "email": "ayesha@test.com",
  "password": "password123"
}
```

Response:

```json
{
  "id": 7,
  "name": "Ayesha",
  "email": "ayesha@test.com",
  "createdAt": "2026-08-19T06:09:35.224Z"
}
```

The password is hashed with bcrypt before being stored and is never returned in API responses.

### 2. Login

**POST** `/auth/login`

Request:

```json
{
  "email": "ayesha@test.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "JWT_TOKEN"
}
```

The JWT contains:

```json
{
  "sub": 7,
  "email": "ayesha@test.com"
}
```

### 3. Send the JWT

For protected routes, send the token in the `Authorization` header:

```text
Authorization: Bearer JWT_TOKEN
```

Example:

```text
GET /tasks

Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

The JWT guard reads the Bearer token, verifies it, and allows the request only when the token is valid.

## API Endpoints

### Authentication

| Method | Endpoint         | Authentication | Description           |
| ------ | ---------------- | -------------- | --------------------- |
| POST   | `/auth/register` | No             | Register a new user   |
| POST   | `/auth/login`    | No             | Login and receive JWT |

### Projects

| Method | Endpoint        | Authentication | Description      |
| ------ | --------------- | -------------- | ---------------- |
| GET    | `/projects`     | No             | List projects    |
| GET    | `/projects/:id` | No             | Get a project    |
| POST   | `/projects`     | JWT            | Create a project |

### Tasks

| Method | Endpoint     | Authentication | Description                     |
| ------ | ------------ | -------------- | ------------------------------- |
| GET    | `/tasks`     | No             | List authenticated user's tasks |
| GET    | `/tasks/:id` | No             | Get a task with relations       |
| POST   | `/tasks`     | JWT            | Create a task                   |
| PATCH  | `/tasks/:id` | JWT            | Update a task                   |
| DELETE | `/tasks/:id` | JWT            | Delete a task                   |

## Task Creation

**POST** `/tasks`

Requires:

```text
Authorization: Bearer JWT_TOKEN
```

Example request:

```json
{
  "title": "Complete NestJS API",
  "description": "Finish authenticated tasks API",
  "status": "todo",
  "priority": 3,
  "projectId": 4
}
```

### CreateTaskDto validation

* `title` is required and must contain at least 3 characters
* `description` is optional
* `status` is restricted to the task status enum
* `status` defaults to `todo`
* `priority` must be an integer between 1 and 5
* `projectId` is required and must be an integer
* `assigneeId` is optional
* `tagIds` is optional

Unknown fields are rejected instead of being silently ignored.

## Task Filters

**GET** `/tasks`

Supported optional filters:

```text
/tasks?status=todo
```

```text
/tasks?projectId=4
```

```text
/tasks?assigneeId=7
```

Filters can be combined:

```text
/tasks?status=todo&projectId=4&assigneeId=7
```

## Task Relations

`GET /tasks/:id` returns the task with the following relations loaded:

* Project
* Assignee
* Tags

Example:

```json
{
  "id": 16,
  "title": "Complete Authenticated NestJS API",
  "description": "Finish and test the complete authenticated tasks API",
  "status": "in_progress",
  "priority": 5,
  "project": {
    "id": 4,
    "name": "My NestJS Project"
  },
  "assignee": null,
  "tags": []
}
```

## Update Task

**PATCH** `/tasks/:id`

Requires JWT authentication.

Example:

```json
{
  "title": "Complete Authenticated NestJS API",
  "status": "in_progress",
  "priority": 5
}
```

`UpdateTaskDto` is derived using `PartialType`, so fields are optional during updates.

## Delete Task

**DELETE** `/tasks/:id`

Requires JWT authentication.

Successful deletion returns:

```text
204 No Content
```

A task that does not exist returns:

```text
404 Not Found
```

## Validation and Error Responses

The application uses a global `ValidationPipe` with:

```text
whitelist: true
forbidNonWhitelisted: true
transform: true
```

Errors are returned through a global exception filter using a consistent response shape:

```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found",
  "timestamp": "2026-08-19T06:35:31.626Z",
  "path": "/tasks/999"
}
```

Invalid request bodies return `400 Bad Request` and identify the offending fields.

Unauthenticated access to protected routes returns:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2026-08-19T06:35:31.626Z",
  "path": "/tasks"
}
```

## Authorization

Write operations on projects and tasks require a valid JWT.

The authenticated user's identity is obtained through the `@CurrentUser` decorator.

Task and project ownership is checked inside the service layer.

Controllers remain thin and do not contain direct repository/database calls.

## Testing

### Unit Tests

Run:

```bash
npm test
```

The unit test suite covers:

* UsersService
* AuthService
* TasksService

Current test result:

```text
3 test suites passed
20 tests passed
```

### End-to-End Tests

Run:

```bash
npm run test:e2e
```

The e2e suite covers:

* User registration
* User login
* JWT authentication
* Project creation
* Unauthenticated project rejection
* Task creation
* Task listing
* Task retrieval
* Task update
* Unauthenticated task rejection
* Task deletion
* 404 after deletion

Current result:

```text
1 test suite passed
11 tests passed
```

## TypeScript Check

Run:

```bash
npx tsc --noEmit
```

The project should compile with zero TypeScript errors.

## Build Check

Run:

```bash
npm run build
```

The production build should complete successfully.

## Authentication Flow

The complete authentication flow is:

1. The client sends `name`, `email`, and `password` to `/auth/register`.
2. The server checks whether the email already exists.
3. The password is hashed using bcrypt.
4. The user is stored with the bcrypt hash.
5. The client sends email and password to `/auth/login`.
6. The server finds the user by email.
7. bcrypt compares the supplied password with the stored hash.
8. If the password is incorrect, the server returns `401 Unauthorized`.
9. If authentication succeeds, the server creates a JWT containing the user's `sub` and `email`.
10. The client stores/uses the returned access token.
11. For protected requests, the client sends `Authorization: Bearer <token>`.
12. The JWT strategy verifies the token.
13. `JwtAuthGuard` allows the request when the token is valid.
14. `@CurrentUser` provides the authenticated account to the controller.
15. The service applies ownership and business rules before accessing or modifying data.

## Security Notes

* Passwords are never stored as plaintext.
* Passwords are never returned in API responses.
* Protected write routes require JWT authentication.
* JWTs have a configured expiration time.
* Unknown DTO fields are rejected.
* Database synchronization is disabled.
* Database credentials and JWT secrets must remain in environment variables.
* `.env` must not be committed to Git.

## License

This project was created as part of the Coding Pixel Week 8 backend internship exercise.
