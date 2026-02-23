---
name: light-dashboard-layout
overview: Redesign authenticated MaintAIn pages into a light SaaS dashboard layout (sidebar + topbar + white content cards) while keeping all existing routes, auth, and API calls intact.
todos:
  - id: layout-components
    content: Add `AppLayout`, `Sidebar`, `Topbar` components for light dashboard shell.
    status: completed
  - id: wrap-auth-routes
    content: Update `src/App.tsx` to nest authenticated routes under `AppLayout` + `Outlet`.
    status: completed
  - id: light-tasks-page
    content: Refactor `TasksListPage` to use light stats row + new filter bar layout (keep URL-synced filters).
    status: completed
  - id: light-taskcard
    content: Create `TaskCard` + small utils and refactor `TaskList` to render light cards while keeping complete/history behavior.
    status: completed
  - id: light-create-edit
    content: Update `CreateTaskPage` and `EditTaskPage` to render inside layout with light card styling (no logic changes).
    status: completed
  - id: smoke-build
    content: Run builds and quick manual smoke checks for navigation + filters.
    status: completed
isProject: false
---

# Light SaaS dashboard UI (sidebar + topbar + cards)

## Goals (per your spec)

- Light dashboard layout for authenticated pages: **sidebar + topbar + main content**.
- Keep existing routes/auth/API calls working.
- Sidebar nav items: **Dashboard**, **All Tasks**, **Overdue**, **Due Soon**.
- Sidebar bottom: **Quick filters** (category buttons) that apply to the Tasks view.
- Main: stats row + tasks filter bar + task list of light TaskCards.
- “Completed (This Month)” card: **placeholder 0** for now.

## Current routing (for safe wrapping)

Existing routes in [src/App.tsx](src/App.tsx): `/`, `/login`, `/tasks`, `/tasks/new`, `/tasks/:id/edit`.

## Layout approach

- Introduce an authenticated layout using **nested routes + `Outlet`**:
  - A parent route element wraps authenticated pages in `<RequireAuth><AppLayout/></RequireAuth>`.
  - Children: `/tasks`, `/tasks/new`, `/tasks/:id/edit`.
- AppLayout sets light UA widgets without touching global dark theme by applying `style={{ colorScheme: 'light' }}` to the layout container.

## What will change

### 1) New layout components

Add (new files):

- [src/layout/AppLayout.tsx](src/layout/AppLayout.tsx)
  - `min-h-screen bg-slate-100` container
  - Sidebar `w-72 bg-slate-900 text-slate-100`
  - Main area `flex-1 p-8` with `max-w-6xl mx-auto`
  - Topbar row: page title + user chip + Logout
  - Renders child routes via `<Outlet />`
- [src/layout/Sidebar.tsx](src/layout/Sidebar.tsx)
  - Nav links:
    - Dashboard → `/tasks?view=dashboard`
    - All Tasks → `/tasks?view=all`
    - Overdue → `/tasks?view=all&status=overdue`
    - Due Soon → `/tasks?view=all&status=dueSoon`
  - Quick filters buttons set `category=...` in URL (preserve `q/status/active` as appropriate)
- [src/layout/Topbar.tsx](src/layout/Topbar.tsx)
  - Reads `useAuth()` for username and logout handler

### 2) Router changes (wrap authenticated pages)

Update [src/App.tsx](src/App.tsx):

- Convert the three authenticated routes to be nested under AppLayout.
- Keep `/`, `/login` unchanged.

### 3) Replace dark dashboard header with light stats row

Update Tasks list page to match new layout:

- Update [src/pages/tasks/TasksListPage.tsx](src/pages/tasks/TasksListPage.tsx):
  - Remove the outer `<main className="min-h-dvh ...">` wrappers (layout provides).
  - Replace `DashboardHeader` usage with a light **StatsRow** section.
  - Keep existing filter/search logic and URL sync (already implemented).
  - Keep “New Task” button in the filter bar row (right-aligned).
  - Set `view` param defaults (if missing, set `view=dashboard` for a clean Dashboard landing).

### 4) Light TaskCard + TaskList

Add (new file):

- [src/pages/tasks/TaskCard.tsx](src/pages/tasks/TaskCard.tsx)
  - White card: `rounded-2xl bg-white border border-slate-200 shadow-sm hover:-translate-y-0.5 transition`
  - Shows:
    - Title + status badges
    - Description (muted)
    - Chips row: Category + Frequency
    - Due line: “Next due in X days” / “Overdue by X days” (or fallback)
    - Actions: Complete / Edit / Delete (Complete enabled if `task.active`)

Update [src/pages/tasks/TaskList.tsx](src/pages/tasks/TaskList.tsx):

- Keep behavior (complete modal + history panel), but refactor UI to:
  - Use `TaskCard` for per-task rendering
  - Light styles for list container and history panel (white/gray borders)

Add small shared utils (new file):

- [src/pages/tasks/taskUi.ts](src/pages/tasks/taskUi.ts)
  - `formatFrequency(unit, interval)`
  - `computeDueDelta(nextDueDate)` returns `{ kind: 'missing'|'overdue'|'dueSoon'|'upcoming', days: number }`

### 5) Inputs/buttons for light theme (scoped)

To avoid breaking the existing dark pages:

- For the dashboard pages only, restyle controls locally (Tailwind classes) rather than changing global `Button/Card/Field` defaults.
- If needed for consistency, add **optional** tone props later:
  - `Button tone="light"` to adjust `ring-offset-`* (current base uses `ring-offset-slate-950`).

### 6) Create/Edit pages inside layout

Update:

- [src/pages/tasks/CreateTaskPage.tsx](src/pages/tasks/CreateTaskPage.tsx)
- [src/pages/tasks/EditTaskPage.tsx](src/pages/tasks/EditTaskPage.tsx)

So they:

- Drop their `<main>` wrappers.
- Render their forms inside white cards.
- Keep all existing submit/update/delete logic unchanged.

## File tree (planned)

- `src/layout/AppLayout.tsx` (new)
- `src/layout/Sidebar.tsx` (new)
- `src/layout/Topbar.tsx` (new)
- `src/pages/tasks/TaskCard.tsx` (new)
- `src/pages/tasks/taskUi.ts` (new)
- `src/App.tsx` (update)
- `src/pages/tasks/TasksListPage.tsx` (update)
- `src/pages/tasks/TaskList.tsx` (update)
- `src/pages/tasks/CreateTaskPage.tsx` (update)
- `src/pages/tasks/EditTaskPage.tsx` (update)

## Test plan

- **Routing**: `/tasks`, `/tasks/new`, `/tasks/:id/edit` render inside AppLayout.
- **Sidebar links**: Overdue/Due Soon apply status filters via URL, list updates.
- **Quick filters**: Category buttons update URL + list.
- **Task actions**: Complete/Edit/Delete still work.
- **Build**: `npm run build` and `backend/npm run build`.

