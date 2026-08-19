# Authenticated Tasks API

A modular NestJS REST API for managing authenticated users, projects, and tasks. The API uses PostgreSQL, TypeORM, JWT authentication, bcrypt password hashing, DTO validation, and automated unit/e2e tests.

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
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── current-user.decorator.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── users.service.spec.ts
├── projects/
│   ├── projects.controller.ts
│   ├── projects.module.ts
│   └── projects.service.ts
├── tasks/
│   ├── dto/
│   ├── tasks.controller.ts
│   ├── tasks.module.ts
│   ├── tasks.service.ts
│   └── tasks.service.spec.ts
├── common/
│   └── http-exception.filter.ts
├── entities/
├── migrations/
├── data-source.ts
├── app.module.ts
└── main.ts

test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

## Requirements

* Node.js
* PostgreSQL
* npm
* Existing Week 7 `task_manager_week7` database

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=task_manager_week7

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1h
```

A `.env.example` file is included in the repository with the required environment variable names and empty values:

```env
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

JWT_SECRET=
JWT_EXPIRES_IN=
```

Copy `.env.example` to `.env` and fill in the values for your local environment.

Do not commit `.env` to GitHub.

## Database

The API uses the existing Week 7 PostgreSQL database:

```text
task_manager_week7
```

TypeORM synchronization is disabled:

```text
synchronize: false
```

The database schema is managed through TypeORM migrations.

### Create the Database

If the Week 7 database does not already exist, create it with:

```bash
createdb task_manager_week7
```

Or from PostgreSQL:

```sql
CREATE DATABASE task_manager_week7;
```

### Run Migrations

From the project root, run:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

If there are no pending migrations, TypeORM will report:

```text
No migrations are pending
```

This means the existing database schema is already up to date.

## Running the Application

Development:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

The API runs on:

```text
http://localhost:3000
```

CORS is enabled for the Next.js development origin:

```text
http://localhost:3000
```

## Authentication

### Register

```http
POST /auth/register
```

Request body:

```json
{
  "name": "Ayesha",
  "email": "ayesha@example.com",
  "password": "password123"
}
```

The password is hashed using bcrypt before it is stored.

The password is never returned in the API response.

### Login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "ayesha@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "access_token": "JWT_TOKEN"
}
```

The JWT contains:

* `sub` — authenticated user's ID
* `email` — authenticated user's email
* expiration time

### Sending the Token

Protected requests must include the JWT in the `Authorization` header:

```http
Authorization: Bearer JWT_TOKEN
```

The JWT authentication guard validates the token before allowing access to protected routes.

## API Endpoints

### Authentication

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| POST   | `/auth/register` | Register a new user   |
| POST   | `/auth/login`    | Login and receive JWT |

### Projects

| Method | Endpoint        | Authentication |
| ------ | --------------- | -------------- |
| GET    | `/projects`     | Public         |
| GET    | `/projects/:id` | Public         |
| POST   | `/projects`     | JWT required   |

### Tasks

| Method | Endpoint     | Authentication |
| ------ | ------------ | -------------- |
| GET    | `/tasks`     | Public         |
| GET    | `/tasks/:id` | Public         |
| POST   | `/tasks`     | JWT required   |
| PATCH  | `/tasks/:id` | JWT required   |
| DELETE | `/tasks/:id` | JWT required   |

## Task Creation

### POST `/tasks`

Authentication:

```http
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

A successful creation returns HTTP `201 Created`.

## Task Validation

`CreateTaskDto` validates:

* `title` — required and at least 3 characters
* `description` — optional
* `status` — optional and restricted to the task status enum
* `priority` — required integer from 1 to 5
* `projectId` — required integer
* `assigneeId` — optional integer
* `tagIds` — optional array of tag IDs

The default task status is `todo`.

Unknown DTO fields are rejected instead of being silently ignored.

## List Tasks and Filters

### GET `/tasks`

The endpoint supports three optional filters:

```text
/tasks?status=todo
```

```text
/tasks?projectId=4
```

```text
/tasks?assigneeId=7
```

The filters can be combined:

```text
/tasks?status=todo&projectId=4&assigneeId=7
```

## Get a Single Task

```http
GET /tasks/:id
```

The response includes:

* project
* assignee
* tags

If the task does not exist, the API returns:

```text
404 Not Found
```

## Update a Task

```http
PATCH /tasks/:id
```

Only the fields that need to change have to be provided.

Example:

```json
{
  "title": "Complete Authenticated NestJS API",
  "status": "in_progress",
  "priority": 5
}
```

## Delete a Task

```http
DELETE /tasks/:id
```

Authentication is required.

A successful deletion returns:

```text
204 No Content
```

If the task does not exist, the API returns:

```text
404 Not Found
```

## Error Handling

The application uses a global HTTP exception filter.

Errors follow a consistent response structure:

```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found",
  "timestamp": "2026-08-19T00:00:00.000Z",
  "path": "/tasks/999"
}
```

Validation errors return HTTP `400`.

Authentication failures return HTTP `401`.

Missing resources return HTTP `404`.

## Validation

A global `ValidationPipe` is enabled with:

* `whitelist: true`
* `forbidNonWhitelisted: true`
* `transform: true`

This means invalid request data is rejected and properties not declared by the DTO are not accepted.

## Tests

### Unit Tests

Run:

```bash
npm test
```

The unit test suite covers authentication, users, and task services.

### End-to-End Tests

Run:

```bash
npm run test:e2e
```

The e2e suite covers:

* user registration
* login
* JWT authentication
* project creation
* unauthenticated access rejection
* task creation
* task listing
* task retrieval
* task update
* task deletion
* 404 after deletion

### TypeScript Check

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
```

## Expected Verification

Before submitting the project, verify that all required checks pass:

```bash
npx tsc --noEmit
```

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run build
```

Migration status can be checked with:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

The expected result when the database is already current is:

```text
No migrations are pending
```

All commands should complete successfully before submission.

## Authentication Flow

1. The client sends name, email, and password to `POST /auth/register`.
2. The server hashes the password with bcrypt and stores the hash.
3. The client sends email and password to `POST /auth/login`.
4. The server finds the user and compares the submitted password with the stored bcrypt hash.
5. If the credentials are correct, the server signs a JWT containing the user's ID (`sub`) and email.
6. The client stores the returned access token.
7. The client sends the token on protected requests using:

```http
Authorization: Bearer JWT_TOKEN
```

8. The JWT authentication guard extracts and validates the token.
9. The JWT strategy verifies the token and resolves the authenticated user.
10. `@CurrentUser()` can then provide the authenticated account to the controller handler.
11. Protected services use that authenticated user ID to enforce ownership rules.

## Submission Checklist

Before submitting the repository:

* [ ] `.env` is not committed.
* [ ] `.env.example` exists and contains all required environment variable names.
* [ ] Database configuration uses environment variables.
* [ ] TypeORM `synchronize` is disabled.
* [ ] Migrations are up to date.
* [ ] DTO validation is enabled.
* [ ] JWT authentication works.
* [ ] Protected routes reject unauthenticated requests.
* [ ] Passwords are hashed with bcrypt.
* [ ] Passwords are not returned in API responses.
* [ ] Unit tests pass.
* [ ] E2E tests pass.
* [ ] TypeScript compilation passes.
* [ ] Production build passes.
* [ ] README commands match the actual project structure and scripts.
* [ ] Final work is pushed to the repository.
* [ ] The required work is merged through a pull request.

## License

This project was created as part of the Week 8 Authenticated Tasks API exercise.
