---
name: default-bills-and-filters-search
overview: Set default create-task category to Bills, then add a Tasks list filter/search bar that syncs to the URL and uses existing server-side query params (`q`, `category`, `active`, `status`, `dueSoonDays`).
todos:
  - id: default-bills-category
    content: Change `CreateTaskPage.emptyDraft()` default `category` from `Other` to `Bills`.
    status: completed
  - id: loadTasks-query-support
    content: Extend `useTasksData.loadTasks()` to accept query params and build `/api/tasks?...` URLs.
    status: completed
  - id: tasks-filters-url-ui
    content: Add filter/search UI to `TasksListPage` using `useSearchParams`, debounced search, and immediate selects; wire Refresh to current filters.
    status: completed
  - id: header-counts-from-items
    content: (Optional) Compute overdue/dueSoon counts in `TasksListPage` from currently loaded items instead of hardcoded 0.
    status: completed
isProject: false
---

# Default Bills + filter/search

## Goals

- **Create task default category** becomes `**Bills`**.
- Add **filter + search UI** on `/tasks`:
  - **Search** (query `q`) with debounce
  - **Category** dropdown (`category`)
  - **Active** dropdown (`active=true|false` or unset)
  - **Status** dropdown (`status=overdue|dueSoon|upcoming` or unset)
- Filters **sync to the URL query string** (persist on refresh/share) and load tasks **instantly**.

## Current state (relevant code)

- Create default category is hardcoded to `Other` in [src/pages/tasks/CreateTaskPage.tsx](src/pages/tasks/CreateTaskPage.tsx):

```12:19:src/pages/tasks/CreateTaskPage.tsx
  return {
    title: '',
    description: '',
    category: 'Other',
    frequencyUnit: 'monthly',
    frequencyInterval: 1,
    startDate: `${yyyy}-${mm}-${dd}`,
  }
```

- Backend already supports filtering via query params in [backend/src/routes/tasks.ts](backend/src/routes/tasks.ts) (`category`, `active|isActive`, `status`, `dueSoonDays`, `q`).
- Frontend task loading is currently fixed to `/api/tasks` in [src/pages/tasks/useTasksData.ts](src/pages/tasks/useTasksData.ts).

## Plan

### 1) Default category: Bills

- Update [src/pages/tasks/CreateTaskPage.tsx](src/pages/tasks/CreateTaskPage.tsx):
  - Change `emptyDraft().category` from `Other` → `Bills`.
  - Ensure **Clear** resets back to `Bills` (already uses `emptyDraft()`).

### 2) Make `loadTasks` accept query params

- Update [src/pages/tasks/useTasksData.ts](src/pages/tasks/useTasksData.ts):
  - Change `loadTasks()` to `loadTasks(query?: { q?: string; category?: string; active?: 'true'|'false'; status?: 'overdue'|'dueSoon'|'upcoming' })`.
  - Build `URLSearchParams` and call:
    - `/api/tasks` if no params
    - `/api/tasks?…` if params exist
  - Keep backward compatibility: existing calls `loadTasks()` keep working.

### 3) Add filter/search bar synced to URL

- Update [src/pages/tasks/TasksListPage.tsx](src/pages/tasks/TasksListPage.tsx):
  - Use `useSearchParams()` for `q`, `category`, `active`, `status`.
  - Render a compact filter bar (likely a `Card`) with:
    - Search input (updates `q` in URL using `{ replace: true }` to avoid history spam)
    - Category select (uses `categories` from `useTasksData`; includes an `All` option)
    - Active select (`All | Active | Inactive`)
    - Status select (`All | Overdue | Due soon | Upcoming`)
    - Clear button (removes all query params)
  - Debounce **only** the network load for `q` (e.g. 250–400ms); selects apply immediately.
  - Enforce backend rule: if `active=false`, clear `status` (since status applies to active tasks only). If user picks a status, force `active=true`.
  - Ensure `TaskList`’s Refresh uses the **current** URL filters.

### 4) (Optional but small) Compute header counts from loaded items

- Replace `overdueCount=0` / `dueSoonCount=0` in `TasksListPage` with simple client-side counts using `nextDueDate` + 7-day window (matches backend default).

## Test plan

- `/tasks/new` opens with category preselected **Bills**.
- `/tasks?category=Bills` filters the list.
- `/tasks?q=filter` searches title/description; typing updates URL and list (debounced requests).
- Setting `active=Inactive` clears/locks status.
- Page refresh preserves filters.
- `npm run build` and `backend/npm run build` pass.

