# Task Management Backend

NestJS + Prisma + PostgreSQL backend for the TaskFlow application.

This README is written for a new developer who just cloned the repository.

## 1) What This Backend Does

- User authentication with JWT access and refresh tokens.
- Task CRUD with search, filtering, and pagination.
- Checklist CRUD under each task, including reorder support.
- Dashboard analytics endpoint for task stats.
- Swagger API docs enabled by default.

## 2) Tech Stack

- Node.js + NestJS
- Prisma ORM + PostgreSQL
- JWT auth
- Class-validator request validation
- Swagger (OpenAPI)

## 3) Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

Optional but recommended:
- Postman or Insomnia for API testing

## 4) Project Structure

~~~text
backend/
  prisma/
    schema.prisma
    migrations/
  src/
    auth/
    tasks/
    prisma/
    common/
    main.ts
  .env.example
  prisma.config.ts
~~~

## 5) First-Time Setup (Step-by-Step)

### Step 1: Install dependencies

~~~bash
npm install
~~~

### Step 2: Create your environment file

Copy .env.example to .env:

~~~bash
cp .env.example .env
~~~

Update values in .env (minimum required):

~~~dotenv
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/task_management_app?schema=public"
PORT=3001
JWT_SECRET="replace-with-a-strong-secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"
CORS_ORIGIN="http://localhost:3000"
~~~

### Step 3: Install and Set Up PostgreSQL

Choose your operating system below. Pick either the Terminal method or the pgAdmin UI method — both lead to the same result.

---

#### macOS — Terminal (Homebrew)

**Install PostgreSQL:**

~~~bash
brew install postgresql@17
~~~

**Start the service:**

~~~bash
brew services start postgresql@17
~~~

**Open the PostgreSQL shell:**

~~~bash
psql postgres
~~~

**Create a user and database:**

~~~sql
CREATE USER taskuser WITH PASSWORD 'yourpassword';
CREATE DATABASE task_management_app OWNER taskuser;
GRANT ALL PRIVILEGES ON DATABASE task_management_app TO taskuser;
\q
~~~

**Set your DATABASE_URL in .env:**

~~~dotenv
DATABASE_URL="postgresql://taskuser:yourpassword@localhost:5432/task_management_app?schema=public"
~~~

---

#### macOS — pgAdmin UI

1. Download and install pgAdmin 4 from https://www.pgadmin.org/download/pgadmin-4-macos/
2. Open pgAdmin. It opens in your browser automatically.
3. In the left panel, expand **Servers → PostgreSQL**.
   - If no server is listed, right-click **Servers → Register → Server**.
   - Name: `Local`, Host: `localhost`, Port: `5432`, Username: `postgres`.
4. Right-click **Login/Group Roles → Create → Login/Group Role**.
   - Name tab: `taskuser`
   - Definition tab: set Password to `yourpassword`
   - Privileges tab: enable **Can login**
   - Click **Save**.
5. Right-click **Databases → Create → Database**.
   - Database: `task_management_app`
   - Owner: `taskuser`
   - Click **Save**.
6. Set your DATABASE_URL in .env:

~~~dotenv
DATABASE_URL="postgresql://taskuser:yourpassword@localhost:5432/task_management_app?schema=public"
~~~

---

#### Windows — Terminal (PowerShell)

**Install PostgreSQL:**

Download and run the installer from https://www.postgresql.org/download/windows/

During install, set a password for the `postgres` superuser. Note it down.

**After install, open PowerShell or Command Prompt and connect:**

~~~powershell
psql -U postgres
~~~

Enter your postgres password when prompted.

**Create a user and database:**

~~~sql
CREATE USER taskuser WITH PASSWORD 'yourpassword';
CREATE DATABASE task_management_app OWNER taskuser;
GRANT ALL PRIVILEGES ON DATABASE task_management_app TO taskuser;
\q
~~~

If `psql` is not found, add it to PATH. Default install path:

~~~text
C:\Program Files\PostgreSQL\17\bin
~~~

To add it: open **System Properties → Environment Variables → Path → Edit → New** and paste the path above.

**Set your DATABASE_URL in .env:**

~~~dotenv
DATABASE_URL="postgresql://taskuser:yourpassword@localhost:5432/task_management_app?schema=public"
~~~

---

#### Windows — pgAdmin UI

1. pgAdmin is bundled with the PostgreSQL Windows installer. Open it from the Start Menu.
2. It opens in your browser. Set a master password if prompted.
3. In the left panel, expand **Servers → PostgreSQL 17**.
   - Enter your postgres password if prompted and click **Save Password**.
4. Right-click **Login/Group Roles → Create → Login/Group Role**.
   - Name tab: `taskuser`
   - Definition tab: set Password to `yourpassword`
   - Privileges tab: enable **Can login**
   - Click **Save**.
5. Right-click **Databases → Create → Database**.
   - Database: `task_management_app`
   - Owner: `taskuser`
   - Click **Save**.
6. Set your DATABASE_URL in .env:

~~~dotenv
DATABASE_URL="postgresql://taskuser:yourpassword@localhost:5432/task_management_app?schema=public"
~~~

---

**Verify the connection (both platforms):**

~~~bash
npx prisma db pull
~~~

If this returns no error, your DATABASE_URL is correct and Prisma can connect.

### Step 4: Apply Prisma migrations

For local development:

~~~bash
npx prisma migrate dev
~~~

For CI/production-style migration apply:

~~~bash
npx prisma migrate deploy
~~~

Generate Prisma client (safe to run anytime):

~~~bash
npx prisma generate
~~~

### Step 5: Start backend server

~~~bash
npm run start:dev
~~~

Backend base URL:

- http://localhost:3001

Swagger docs:

- http://localhost:3001/api
- Swagger JSON: http://localhost:3001/api.json

## 6) Available Scripts

~~~bash
npm run start         # run once
npm run start:dev     # watch mode (recommended for development)
npm run build         # build to dist/
npm run start:prod    # run built app
npm run lint
npm run test
npm run test:e2e
npm run test:cov
~~~

## 7) Database Schema Summary

Main models in prisma/schema.prisma:

- User
- Task
- ChecklistItem

Enums:

- TaskPriority: LOW, MEDIUM, HIGH
- TaskStatus: TODO, IN_PROGRESS, DONE

Relations:

- One user has many tasks.
- One task has many checklist items.
- Deleting a user cascades to tasks.
- Deleting a task cascades to checklist items.

## 8) Auth Model and Token Flow

- Register/login returns:
  - access_token
  - refresh_token
  - user object
- Access token is required in Authorization header:
  - Authorization: Bearer YOUR_ACCESS_TOKEN
- Refresh token endpoint rotates refresh token each time you call refresh.
- Logout invalidates stored refresh token in DB.

## 9) Global API Response Format

Successful responses are wrapped as:

~~~json
{
  "success": true,
  "data": {},
  "timestamp": "2026-04-26T10:00:00.000Z"
}
~~~

Error responses are wrapped as:

~~~json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation message"
  },
  "timestamp": "2026-04-26T10:00:00.000Z"
}
~~~

## 10) Full API Endpoint Reference

Base URL for all endpoints below:

- http://localhost:3001

### 10.1 Auth Endpoints

1. POST /auth/register
- Auth required: No
- Body:
~~~json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Passw0rd!",
  "confirmPassword": "Passw0rd!"
}
~~~
- Notes:
  - Password must contain uppercase, lowercase, number, special character, min 8 chars.
  - password and confirmPassword must match.

2. POST /auth/login
- Auth required: No
- Body:
~~~json
{
  "email": "john@example.com",
  "password": "Passw0rd!"
}
~~~

3. POST /auth/refresh
- Auth required: No
- Body:
~~~json
{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
~~~

4. GET /auth/profile
- Auth required: Yes (Bearer access token)
- Body: none

5. POST /auth/logout
- Auth required: Yes (Bearer access token)
- Body: none

### 10.2 Task Endpoints

1. POST /tasks
- Auth required: Yes
- Body:
~~~json
{
  "title": "Finish API integration",
  "description": "Integrate all task endpoints with frontend.",
  "priority": "MEDIUM",
  "status": "TODO",
  "dueDate": "2026-12-31T23:59:59.000Z"
}
~~~

2. GET /tasks
- Auth required: Yes
- Query params (all optional):
  - search: string
  - priority: LOW | MEDIUM | HIGH
  - status: TODO | IN_PROGRESS | DONE
  - page: number (default 1)
  - limit: number (default 10, max 100)
- Example:
~~~text
GET /tasks?search=integration&priority=HIGH&status=TODO&page=1&limit=10
~~~

3. GET /tasks/:id
- Auth required: Yes
- Path param: id (task id)

4. PATCH /tasks/:id
- Auth required: Yes
- Body (all fields optional, at least one required):
~~~json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2026-12-31T23:59:59.000Z"
}
~~~

5. PATCH /tasks/:id/status
- Auth required: Yes
- Body:
~~~json
{
  "status": "DONE"
}
~~~

6. DELETE /tasks/:id
- Auth required: Yes
- Deletes one task

7. DELETE /tasks
- Auth required: Yes
- Deletes all tasks for current user

8. DELETE /tasks/bulk
- Auth required: Yes
- Body:
~~~json
{
  "taskIds": ["task_id_1", "task_id_2", "task_id_3"]
}
~~~
- Notes:
  - taskIds must be a non-empty array
  - duplicates are ignored server-side

9. GET /tasks/dashboard
- Auth required: Yes
- Returns:
  - top-level stats
  - completion rate
  - priority/status breakdown
  - recent tasks
  - attention-needed tasks

### 10.3 Checklist Endpoints

All checklist endpoints are task-scoped and require auth.

1. GET /tasks/:id/checklist
- Returns checklist items + progress summary

2. POST /tasks/:id/checklist
- Body:
~~~json
{
  "title": "Write integration tests"
}
~~~

3. PATCH /tasks/:id/checklist/:itemId
- Body:
~~~json
{
  "title": "Updated checklist title",
  "isCompleted": true
}
~~~
- At least one field is expected.

4. PATCH /tasks/:id/checklist/:itemId/reorder
- Body:
~~~json
{
  "position": 0
}
~~~

5. DELETE /tasks/:id/checklist/:itemId
- Deletes one checklist item and returns updated progress

## 11) Typical Local Development Workflow

1. Start PostgreSQL.
2. Run backend in watch mode:
~~~bash
npm run start:dev
~~~
3. Open Swagger and test APIs:
- http://localhost:3001/api
4. Register or login to get tokens.
5. Click Authorize in Swagger and paste:
~~~text
Bearer YOUR_ACCESS_TOKEN
~~~
6. Test all protected task/checklist endpoints.

## 12) Troubleshooting

1. Error: DATABASE_URL is not set
- Ensure .env exists in backend root.
- Ensure DATABASE_URL has correct format.
- Restart server after editing .env.

2. Prisma connection/auth errors
- Verify DB is running.
- Verify database/user/password in DATABASE_URL.
- Run:
~~~bash
npx prisma migrate dev
npx prisma generate
~~~

3. CORS blocked in browser
- Update CORS_ORIGIN in .env to include your frontend URL.
- You can provide multiple origins separated by commas.

4. 401 on protected endpoints
- Ensure Authorization header uses Bearer token format.
- If access token expired, call /auth/refresh using refresh token.

## 13) Production Notes

- Use strong JWT_SECRET and secure secret management.
- Restrict CORS_ORIGIN to your real frontend domains only.
- Run migrations with:
~~~bash
npx prisma migrate deploy
~~~
- Build and run:
~~~bash
npm run build
npm run start:prod
~~~

## 14) Useful File References

- API bootstrap and Swagger setup: src/main.ts
- Auth controller/service: src/auth/auth.controller.ts, src/auth/auth.service.ts
- Tasks controller/service: src/tasks/tasks.controller.ts, src/tasks/tasks.service.ts
- Admin controller/service: src/admin/admin.controller.ts, src/admin/admin.service.ts
- Prisma schema: prisma/schema.prisma
- Environment template: .env.example

## 15) API Changes & Deprecations

### Removed Endpoints
- **PATCH /admin/users/{id}/role** — Removed (user roles can no longer be changed via API)
  - Reason: Role management should be handled separately or not exposed through the API
  - All user roles are now fixed at account creation (ADMIN or USER)

### Available Admin Endpoints
- **GET /admin/stats** — Get platform-wide statistics
- **GET /admin/users** — Get paginated list of all users with filtering and sorting
- **GET /admin/users/all** — Get all active users for task assignment (no pagination)
- **GET /admin/users/:id** — Get user details by ID
- **PATCH /admin/users/:id/status** — Activate or deactivate a user account
