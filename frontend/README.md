# Task Management Frontend

Next.js + Redux Toolkit + Tailwind CSS frontend for the TaskFlow application.

This README is written for a new developer who just cloned the repository.

## 1) What This Frontend Does

- User registration, login, and session management with JWT token refresh.
- Dashboard with task statistics, completion rate, priority breakdown, and attention-needed tasks.
- Task list with search, filtering by status/priority, and pagination.
- Full task CRUD — create, view details, edit, update status, delete one, delete selected, delete all.
- Checklist management under each task — add/edit/reorder/delete items.
- Animated UI interactions for all mutation flows.

## 2) Tech Stack

- Next.js 16 (App Router)
- React 19
- Redux Toolkit + React Redux
- Axios (global interceptors for auth and response unwrapping)
- Tailwind CSS v4
- Lucide React icons
- TypeScript

## 3) Prerequisites

- Node.js 20–23
- npm 10+
- Backend running at http://localhost:3001 (see `backend/README.md`)

## 4) Project Structure

~~~text
frontend/
  src/
    app/
      (auth)/
        login/          — Login page
        register/       — Register page
      (dashboard)/
        dashboard/
          page.tsx      — Dashboard stats page
          tasks/
            page.tsx    — Task list page
    components/
      layout/
        Sidebar.tsx
        PageHeader.tsx
      shared/
        TaskFormModal.tsx
        TaskDetailsModal.tsx
      ui/
        Badge, Button, Card, Input, Spinner
    features/
      auth/
        authSlice.ts    — Auth Redux state + thunks
        useAuth.ts      — Auth hook
      tasks/
        tasksSlice.ts   — Tasks Redux state + thunks
        useTasks.ts     — Tasks hook
    lib/
      apiClient.ts      — Axios instance + auth + refresh interceptors
      authTokens.ts     — Cookie token storage
      mockData.ts
      utils.ts
    services/
      authService.ts    — Auth API calls
      taskService.ts    — Task API calls
    store/
      index.ts
      hooks.ts
      StoreProvider.tsx
    types/
      auth.types.ts
      task.types.ts
      api.types.ts
  .env.local.example    — Environment variables template
~~~

## 5) First-Time Setup (Step-by-Step)

### Step 1: Install dependencies

~~~bash
npm install
~~~

### Step 2: Create your environment file

Copy .env.example to .env.local:

~~~bash
cp .env.example .env.local
~~~

Set the backend API URL in .env.local:

~~~dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
~~~

Note: Make sure this URL does not have a trailing slash.

### Step 3: Start the backend first

The frontend expects the backend running at the URL set above.
See `backend/README.md` for backend setup steps.

### Step 4: Start the frontend

~~~bash
npm run dev
~~~

App URL: http://localhost:3000

## 6) Available Scripts

~~~bash
npm run dev           # development mode (webpack, recommended)
npm run dev:turbo     # development mode (Turbopack, faster HMR)
npm run build         # production build
npm run start         # serve production build on port 3000
npm run lint
~~~

## 7) Environment Variables

All environment variables are prefixed with NEXT_PUBLIC_ to be accessible in the browser.

| Variable               | Required | Default                  | Description                  |
|------------------------|----------|--------------------------|------------------------------|
| NEXT_PUBLIC_API_URL    | Yes      | http://localhost:3001    | Backend base URL             |

## 8) Auth Flow

1. User registers or logs in.
2. Backend returns `access_token`, `refresh_token`, and `user` object.
3. Tokens are stored in cookies via `authTokens.ts`.
4. Every API request attaches the access token via Axios request interceptor.
5. On a 401 response, the Axios response interceptor:
   - Pauses all pending requests.
   - Calls `POST /auth/refresh` once with the stored refresh token.
   - Replays all queued requests with the new token.
   - If refresh fails, clears tokens and redirects to /login.
6. Logout clears cookies and calls `POST /auth/logout`.

## 9) Pages and Routes

| Route                        | Auth Required | Description                  |
|------------------------------|---------------|------------------------------|
| /                            | No            | Redirects to /login or /dashboard/tasks |
| /login                       | No            | Login form                   |
| /register                    | No            | Registration form            |
| /dashboard                   | Yes           | Dashboard stats overview     |
| /dashboard/tasks             | Yes           | Task list, filters, CRUD     |

## 10) State Management

Redux Toolkit is used for global state.

### Auth slice (`authSlice.ts`)

Actions:
- `initializeAuth` — restores session from cookies on app load
- `loginUser` — login API call + saves tokens
- `registerUser` — register API call + saves tokens
- `logoutUser` — logout API call + clears tokens

State fields:
- `user` — logged-in user object
- `isAuthenticated`
- `isInitialized` — true after session restore completes
- `isLoading`
- `error`

Hook: `useAuth()`

### Tasks slice (`tasksSlice.ts`)

Actions:
- `fetchTasks` — paginated list with filters
- `fetchTaskById` — single task details
- `fetchTaskDashboard` — dashboard stats
- `createTask`
- `updateTask`
- `updateTaskStatus`
- `deleteTask`
- `deleteAllTasks`
- `deleteSelectedTasks`

State fields:
- `items` — current page tasks
- `currentTask` — task details for view/edit
- `dashboard` — dashboard stats
- `pagination` — page, limit, total, totalPages, hasNextPage, hasPreviousPage
- `query` — current active filters
- `isLoading`, `isRefreshing`, `isSaving`, `error`

Hook: `useTasks()`

## 11) API Client

`src/lib/apiClient.ts` is the central Axios instance.

Key behaviors:
- Base URL: `NEXT_PUBLIC_API_URL`
- Attaches `Authorization: Bearer TOKEN` to all requests automatically.
- Skips auth header for `/auth/refresh` to avoid circular retry.
- Unwraps backend response envelope `{ success, data, timestamp }` so all callers receive `data` directly.
- Handles 401 with token refresh and request replay queue.

## 12) Components

### Shared components

- `TaskFormModal` — Create and edit task form
- `TaskDetailsModal` — View task details + full checklist management (add/edit/reorder/delete)

### Layout components

- `Sidebar` — Navigation sidebar
- `PageHeader` — Page heading bar

### UI primitives

- `Badge`, `Button`, `Card`, `Input`, `Spinner`

## 13) Task List Features

Available at `/dashboard/tasks`:

- Search by title (debounced)
- Filter by status (All, To Do, In Progress, Done)
- Filter by priority (All, High, Medium, Low)
- Pagination (previous/next)
- Per-row actions: view details, edit, delete
- Row checkbox selection for bulk operations
- Delete Selected — animated exit + warning card confirmation + auto-refetch remaining
- Delete All — animated exit + warning card confirmation

## 14) Checklist Features

Available inside Task Details modal:

- View all checklist items with completion percentage
- Add new checklist item
- Edit title or toggle completion
- Drag-to-reorder with smooth FLIP animation
- Delete with fade/collapse animation

## 15) Typical Development Workflow

1. Start backend (backend/README.md).
2. Start frontend:
~~~bash
npm run dev
~~~
3. Open http://localhost:3000.
4. Register a new account or log in.
5. Use the dashboard and task list.

## 16) Troubleshooting

1. API requests fail with network error
   - Verify backend is running on the port set in `NEXT_PUBLIC_API_URL`.
   - Check `.env.local` exists and has no trailing slash in the URL.

2. Login succeeds but session resets on reload
   - Ensure cookies are not blocked (check browser settings).
   - Verify `JWT_SECRET` in the backend matches between restarts.

3. 401 errors on all requests after login
   - Open DevTools → Network and check the `/auth/refresh` response.
   - If refresh is also 401, the refresh token expired — log in again.

4. Build fails with TypeScript errors
   - Run `npm run build` and check the error output.
   - Ensure `NEXT_PUBLIC_API_URL` is set; the build does not fail without it but runtime will warn.

## 17) Production Build

~~~bash
npm run build
npm run start
~~~

App runs on http://localhost:3000.

For deployment:
- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL in environment config.
- Ensure CORS on the backend allows your frontend domain.

## 18) Useful File References

- API client and interceptors: src/lib/apiClient.ts
- Token storage: src/lib/authTokens.ts
- Auth state: src/features/auth/authSlice.ts
- Tasks state: src/features/tasks/tasksSlice.ts
- Auth API calls: src/services/authService.ts
- Task API calls: src/services/taskService.ts
- Task list page: src/app/(dashboard)/dashboard/tasks/page.tsx
- Dashboard page: src/app/(dashboard)/dashboard/page.tsx
- Environment template: .env.example

## 19) Recent Changes

### v1.1 — Admin Panel & UI Enhancements
- ✅ Added admin panel with user management dashboard
- ✅ Implemented live user search with filtering (status) and sorting (name, date, task count)
- ✅ Added user status toggling (activate/deactivate accounts)
- ✅ Improved dropdown component with portal rendering for table rows
- ✅ Enhanced task page search and filter UI responsiveness
- ✅ Unified all frontend dropdowns to custom-styled `CustomSelect` component
- ✅ Added calendar date picker with past-date blocking for task due dates
- ✅ Auto-sync task status to IN_PROGRESS/DONE based on checklist completion