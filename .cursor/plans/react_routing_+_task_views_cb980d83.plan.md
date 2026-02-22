---
name: React routing + task views
overview: Add client-side routing with clean URLs (BrowserRouter) and refactor task create/edit into their own pages while keeping existing API/auth logic intact.
todos:
  - id: add-router-dep
    content: Install `react-router-dom` and wire up `BrowserRouter` in `src/main.tsx`.
    status: completed
  - id: app-routes-guards
    content: Refactor `src/App.tsx` to use routes + auth guards + keep session refresh behavior.
    status: completed
  - id: extract-tasks-hook
    content: Create `src/pages/tasks/useTasksData.ts` to centralize tasks/categories loading and normalization.
    status: completed
  - id: create-task-pages
    content: Add `TasksListPage`, `CreateTaskPage`, `EditTaskPage` and move create/edit flows into their own views.
    status: completed
  - id: update-tasklist-ui
    content: Update `src/pages/tasks/TaskList.tsx` to remove inline edit and navigate to `/tasks/:id/edit`; add link to `/tasks/new`.
    status: completed
  - id: verify
    content: Run `npm run build` and smoke-test navigation, redirects, create/edit/delete flows.
    status: completed
isProject: false
---

### Goals

- Replace `App.tsx` view-state navigation with real URLs.
- Introduce separate pages for task list, create, and edit.
- Preserve existing backend/API behavior and `authFetch` usage.

### Routing map (BrowserRouter)

- `/` → Landing
- `/login` → Login
- `/tasks` → Task list/dashboard
- `/tasks/new` → Create task view
- `/tasks/:id/edit` → Edit task view
- `*` → redirect to `/` (or a simple 404 page)

### Auth guarding behavior

- If **not authenticated**:
  - Visiting `/tasks`, `/tasks/new`, `/tasks/:id/edit` redirects to `/login`.
- If **authenticated**:
  - Visiting `/login` redirects to `/tasks`.
- Keep the existing “restore session on load” behavior (`refresh()` call), but move it into a small route wrapper so it runs once and doesn’t break routing.

### Task pages refactor (create/edit as own views)

- Extract the shared fetching + normalization logic currently inside `src/pages/Tasks.tsx` into a reusable hook:
  - `src/pages/tasks/useTasksData.ts`
  - Responsibilities:
    - load categories from `/api/task-categories`
    - load tasks from `/api/tasks` via `authFetch`
    - provide `normalizeCategory()` and `categoriesReady`
- Replace the current monolithic `Tasks.tsx` with route pages:
  - `src/pages/tasks/TasksListPage.tsx` (uses dashboard header + list)
  - `src/pages/tasks/CreateTaskPage.tsx` (uses the existing create form UI, with its own page wrapper)
  - `src/pages/tasks/EditTaskPage.tsx` (loads the task from the fetched list and edits via PATCH; if not found, show a friendly “Task not found” state and link back)
- Update the list UI so it **navigates** to edit instead of inline-editing:
  - Keep the same delete logic (`DELETE /api/tasks/:id`)
  - Edit button becomes a link/navigation to `/tasks/:id/edit`
  - Add an “Add task” button linking to `/tasks/new`

### Files to change/add

- Update:
  - `src/main.tsx`: wrap app in `BrowserRouter`
  - `src/App.tsx`: replace `useState(view)` with route definitions + guards
  - `src/pages/tasks/TaskList.tsx`: remove inline edit UI; keep card rendering + actions aligned right
- Add:
  - `src/pages/tasks/useTasksData.ts`
  - `src/pages/tasks/TasksListPage.tsx`
  - `src/pages/tasks/CreateTaskPage.tsx`
  - `src/pages/tasks/EditTaskPage.tsx`

### Dependency

- Add `react-router-dom` (and types if needed).

### Verification

- Manual:
  - Directly open `http://localhost:5173/tasks` while logged out → redirected to `/login`
  - Log in → redirected to `/tasks`
  - Create task at `/tasks/new` → returns to `/tasks` and shows the new task
  - Edit task at `/tasks/:id/edit` → returns to `/tasks` and shows updated values
  - Reload the page on any route (e.g. `/tasks`) and confirm it still works
- Build:
  - `npm run build`

### Note for production hosting

- Because you chose BrowserRouter, your production host must rewrite unknown routes to `index.html` (SPA fallback).

