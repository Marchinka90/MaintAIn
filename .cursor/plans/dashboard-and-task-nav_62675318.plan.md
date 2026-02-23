---
name: dashboard-and-task-nav
overview: Introduce a distinct `/dashboard` overview route and keep `/tasks` as the single full management view, while reusing `/tasks?status=...` for focused filtered views. Update sidebar/topbar titles and filter behavior without changing backend APIs.
todos:
  - id: routes-dashboard-and-redirects
    content: Add `/dashboard` route under `AppLayout` and redirect legacy `view=` URLs; update post-login/landing default navigation to `/dashboard`.
    status: completed
  - id: sidebar-links
    content: Update `Sidebar` nav links to `/dashboard` and `/tasks?...`; ensure quick category filters target `/tasks` and preserve relevant params.
    status: completed
  - id: topbar-titles
    content: Update `AppLayout` title inference based on pathname + `status` query param (no `view=`).
    status: completed
  - id: dashboard-page
    content: Create `DashboardPage` that loads active tasks, computes stats, shows top 5 overdue and due soon, and provides “View All Tasks” button.
    status: completed
  - id: taskcard-dashboard-mode
    content: Add `TaskCard` props to hide history UI for Dashboard while keeping quick actions.
    status: completed
  - id: tasks-management-view
    content: Refactor `TasksListPage` to be the single management view; update filter bar to Status(All/Overdue/DueSoon/Upcoming/Inactive)+Category+Search and keep URL sync + reload behavior.
    status: completed
isProject: false
---

# Distinct Dashboard vs Tasks Navigation

## Goals

- Make each nav item have a **distinct purpose** with minimal duplication:
  - `/dashboard`: overview/control center (stats + 2 limited sections)
  - `/tasks`: full management (filter bar + full list)
  - `/tasks?status=overdue|dueSoon`: focused filtered management view (same layout as `/tasks`)
- **No backend/API changes**.
- Keep compatibility by **redirecting** old URLs using `view=`.

## Route + nav behavior (source of truth)

- **Dashboard**
  - **URL**: `/dashboard`
  - **UI**: stats row + “Overdue Tasks” (top 5) + “Due Soon” (top 5) + “View All Tasks” → `/tasks`
  - **No** advanced filter bar, no category dropdown, no full list.
  - Allow **quick actions** on cards (Complete/Edit/Delete) but keep the layout “overview-first”.
- **All Tasks**
  - **URL**: `/tasks`
  - **UI**: filter bar (Status/Category/Search) + full list + New Task + per-task actions.
- **Overdue**
  - **URL**: `/tasks?status=overdue`
  - **UI**: same as All Tasks layout, with status pre-applied; topbar title “Overdue Tasks”.
- **Due Soon**
  - **URL**: `/tasks?status=dueSoon`
  - **UI**: same as All Tasks layout, with status pre-applied (7 days); topbar title “Due Soon”.

## Implementation details (minimal + consistent)

### 1) Add `/dashboard` route and redirects for old `view=` URLs

- Update `[src/App.tsx](src/App.tsx)`:
  - Add authenticated route: `/dashboard` → new `DashboardPage`.
  - Add lightweight redirects:
    - `/tasks?view=dashboard` → `/dashboard`
    - `/tasks?view=all` → `/tasks`
  - Update auth-driven defaults:
    - After login, default redirect becomes `/dashboard` (unless `state.from` exists).
    - Landing “Get started” goes to `/dashboard` when authenticated.

### 2) Sidebar links point to the new canonical URLs

- Update `[src/layout/Sidebar.tsx](src/layout/Sidebar.tsx)`:
  - Nav links:
    - Dashboard → `/dashboard`
    - All Tasks → `/tasks`
    - Overdue → `/tasks?status=overdue`
    - Due Soon → `/tasks?status=dueSoon`
  - Quick category filters:
    - Navigate to `/tasks?category=...` (and preserve `q/status/active` if present).

### 3) Topbar title derives from route + query

- Update `[src/layout/AppLayout.tsx](src/layout/AppLayout.tsx)`:
  - Replace `view`-based title inference with:
    - `/dashboard` → “Dashboard”
    - `/tasks/new` → “New Task”
    - `/tasks/:id/edit` → “Edit Task”
    - `/tasks`:
      - `status=overdue` → “Overdue Tasks”
      - `status=dueSoon` → “Due Soon”
      - otherwise → “All Tasks”

### 4) Create a dedicated Dashboard page (overview-only)

- Add `[src/pages/dashboard/DashboardPage.tsx](src/pages/dashboard/DashboardPage.tsx)`:
  - Fetch once (no filters UI): call `loadTasks({ active: 'true' })` via `useTasksData({ loadTasks: false })`.
  - Compute:
    - counts: overdue, dueSoon (7 days), active
    - top lists: first 5 overdue and first 5 dueSoon (sorted by `nextDueDate` asc from backend)
    - completedThisMonth: placeholder `0` (until an aggregate endpoint exists)
  - Render:
    - stats row
    - section cards “Overdue Tasks” + “Due Soon” (each list up to 5; empty state if none)
    - button “View All Tasks” → `/tasks`
  - Use existing `TaskCard` for list items, but **hide history UI** (see next step).

### 5) Keep `TaskCard` reusable, but allow Dashboard to be “overview-first”

- Update `[src/pages/tasks/TaskCard.tsx](src/pages/tasks/TaskCard.tsx)`:
  - Add props to control chrome:
    - `showHistory?: boolean` (default `true`)
    - optionally `showDelete?: boolean` if you want fewer destructive actions on Dashboard (default `true`)
  - Dashboard will pass `showHistory={false}` and still pass quick action handlers.

### 6) Make `/tasks` the single management view (filter bar + full list)

- Update `[src/pages/tasks/TasksListPage.tsx](src/pages/tasks/TasksListPage.tsx)`:
  - Remove the “Dashboard” meaning from this page entirely.
  - Keep filter bar + full list.
  - Update filter semantics to match your spec:
    - Status dropdown options: **All / Overdue / Due Soon / Upcoming / Inactive**
      - Map “Inactive” to `active=false` and clear `status` (backend doesn’t support `status=inactive`).
      - Selecting Overdue/DueSoon/Upcoming forces `active=true`.
    - Category dropdown + Search remain.
  - Keep URL as the source of truth and ensure sidebar URL changes trigger `loadTasks()`.

## Test plan

- Routing:
  - Visiting `/dashboard` shows overview (no filter bar, no full list).
  - Visiting `/tasks` shows management view (filter bar + full list).
  - Visiting `/tasks?status=overdue` sets title “Overdue Tasks” and pre-applies filter.
  - Old links:
    - `/tasks?view=dashboard` redirects to `/dashboard`
    - `/tasks?view=all` redirects to `/tasks`
- Sidebar:
  - Overdue/Due Soon links apply filters and list updates.
  - Quick category filters navigate to `/tasks?category=...` and list updates.
- Build:
  - `npm run build` and `backend/npm run build`

