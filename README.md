# TaskFlow — Task Management App

A full-stack task management application with JWT authentication, task CRUD, checklist management, and bulk operations.

## What's Inside

```
task-management-app/
  backend/    — NestJS REST API + Prisma + PostgreSQL
  frontend/   — Next.js + Redux Toolkit + Tailwind CSS
```

## Tech Stack

| Layer    | Technology                                     |
|----------|------------------------------------------------|
| Backend  | NestJS, Prisma ORM, PostgreSQL, JWT, Swagger   |
| Frontend | Next.js 16, React 19, Redux Toolkit, Tailwind CSS v4, Axios |

## Features

- Register, login, and session management with rotating JWT refresh tokens
- Create, edit, view, and delete tasks with title, description, priority, status, and due date
- Checklist items per task — add, edit, reorder, delete
- Bulk operations — delete selected tasks or delete all tasks
- Dashboard with task stats, completion rate, and priority breakdown
- Paginated task list with search and filters (status, priority)

## Quick Start

### 1) Prerequisites

- Node.js 20–23
- PostgreSQL 14+
- npm 10+

### 2) Set up the backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npx prisma migrate deploy
npm run start:dev
```

Backend runs at: http://localhost:3001  
Swagger API docs: http://localhost:3001/api

See [backend/README.md](backend/README.md) for full setup details.

### 3) Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

Frontend runs at: http://localhost:3000

See [frontend/README.md](frontend/README.md) for full setup details.

## Project Structure

```
backend/
  src/
    auth/         — Register, login, refresh, logout, profile
    tasks/        — Task CRUD, bulk delete, dashboard stats
    checklist/    — Checklist item management per task
    prisma/       — Prisma service
    common/       — Global filters and interceptors
  prisma/
    schema.prisma
    migrations/

frontend/
  src/
    app/          — Next.js App Router pages
    features/     — Redux slices + hooks (auth, tasks)
    services/     — API call functions
    components/   — UI and layout components
    lib/          — Axios client, token storage, utils
    store/        — Redux store setup
    types/        — Shared TypeScript types
```

## Environment Files

| File                    | Purpose                            |
|-------------------------|------------------------------------|
| backend/.env.example    | Backend environment template       |
| frontend/.env.example   | Frontend environment template      |

Never commit real `.env` or `.env.local` files — they are excluded by `.gitignore`.

## API Overview

Base URL: `http://localhost:3001`

| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| POST   | /auth/register        | Create account            |
| POST   | /auth/login           | Login                     |
| POST   | /auth/refresh         | Refresh access token      |
| POST   | /auth/logout          | Logout                    |
| GET    | /auth/profile         | Get current user          |
| GET    | /tasks                | List tasks (paginated)    |
| POST   | /tasks                | Create task               |
| GET    | /tasks/dashboard      | Dashboard stats           |
| GET    | /tasks/:id            | Get task by ID            |
| PATCH  | /tasks/:id            | Update task               |
| PATCH  | /tasks/:id/status     | Update task status        |
| DELETE | /tasks/:id            | Delete task               |
| DELETE | /tasks/bulk           | Delete selected tasks     |
| DELETE | /tasks                | Delete all tasks          |
| GET    | /tasks/:id/checklist  | Get checklist items       |
| POST   | /tasks/:id/checklist  | Add checklist item        |
| PATCH  | /tasks/:id/checklist/:itemId | Update checklist item |
| DELETE | /tasks/:id/checklist/:itemId | Delete checklist item |

Full API reference with request/response examples: [backend/README.md](backend/README.md)

## License

MIT
