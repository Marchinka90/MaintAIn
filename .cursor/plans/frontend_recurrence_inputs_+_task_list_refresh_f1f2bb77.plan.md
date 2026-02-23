---
name: Frontend recurrence inputs + task list refresh
overview: Expose the new recurrence/scheduling fields in the React frontend, remove Active from create (defaults active=true), and redesign the task list cards to show scheduling info while moving Refresh into the task list header.
todos:
  - id: extend-useTasksData-types
    content: Update `TaskItem`/`TaskDraft` and include recurrence fields in create/update payloads in `src/pages/tasks/useTasksData.ts`.
    status: completed
  - id: create-form-recurrence
    content: Update create flow (`CreateTaskPage` + `CreateTaskCard`) to add frequency/unit/startDate inputs and remove Active checkbox.
    status: completed
  - id: edit-form-recurrence
    content: Update `EditTaskPage` to add/edit recurrence inputs while keeping Active toggle.
    status: completed
  - id: tasklist-schedule-ui
    content: Redesign `TaskList` cards to show next due + frequency + computed status badge.
    status: completed
  - id: move-refresh-button
    content: Move Refresh action from `DashboardHeader` into the task list header (wire to `loadTasks`).
    status: completed
  - id: verify-frontend
    content: Run `npm run build` and smoke-test create/edit/list refresh in the browser.
    status: completed
isProject: false
---

## Goals

- Show recurrence/scheduling inputs when creating/editing tasks.
- **Create**: remove the Active checkbox; new tasks are active by default.
- **Edit**: keep Active toggle.
- Update task list cards to display `nextDueDate` + recurrence info and a status badge.
- Move **Refresh** action from the top-right header into the task list card header.

## What will change

### 1) Extend frontend types + payloads

Update `[src/pages/tasks/useTasksData.ts](src/pages/tasks/useTasksData.ts)`:

- `**TaskItem`**: add optional fields returned by backend:
  - `startDate?: string`, `nextDueDate?: string`, `lastCompletedAt?: string`
- `**TaskDraft`**: extend to include recurrence inputs:
  - `frequencyUnit: 'weekly'|'monthly'|'yearly'`
  - `frequencyInterval: number`
  - `startDate: string` (ISO string or `YYYY-MM-DD` from date input)
  - keep `active` only for edit usage
- `**createTask()**`: send `frequencyUnit`, `frequencyInterval`, `startDate`; omit `active` (backend defaults to active).
- `**updateTask()**`: send `frequencyUnit`, `frequencyInterval`, `startDate`, and `active`.

### 2) Add recurrence inputs to Create UI (and remove Active)

Update `[src/pages/tasks/CreateTaskCard.tsx](src/pages/tasks/CreateTaskCard.tsx)` and `[src/pages/tasks/CreateTaskPage.tsx](src/pages/tasks/CreateTaskPage.tsx)`:

- Add inputs:
  - Frequency unit (select: weekly/monthly/yearly)
  - Frequency interval (number input, min 1)
  - Start date (date input)
- Remove the Active checkbox from Create.
- Ensure create validation covers:
  - title non-empty
  - interval >= 1
  - startDate valid

### 3) Add recurrence inputs to Edit UI (keep Active)

Update `[src/pages/tasks/EditTaskPage.tsx](src/pages/tasks/EditTaskPage.tsx)`:

- Pre-fill form from the task’s `frequencyUnit`, `frequencyInterval`, `startDate`.
- Add the same inputs as Create + keep Active toggle.
- Save uses `updateTask()` so backend recomputes `nextDueDate`.

### 4) Redesign task list cards (show schedule + status)

Update `[src/pages/tasks/TaskList.tsx](src/pages/tasks/TaskList.tsx)`:

- Keep card-list layout (per your preference), but inside each card show:
  - **Next due** (formatted date)
  - **Frequency** (e.g. “Every 2 weeks”)
  - **Status badge** computed client-side from `nextDueDate`:
    - overdue / due soon (7d default) / upcoming / inactive
- Add a compact “meta row” under the title with category + next due + frequency.

### 5) Move Refresh button into the task list header

Update `[src/pages/tasks/TasksListPage.tsx](src/pages/tasks/TasksListPage.tsx)` and `[src/pages/tasks/DashboardHeader.tsx](src/pages/tasks/DashboardHeader.tsx)`:

- Remove Refresh from the header actions.
- Add a Refresh button in the TaskList header area (right side) that calls `loadTasks()`.
- Keep Logout/Home in the header.

## Verification

- Frontend build: `npm run build`
- Manual:
  - `/tasks/new`: can set frequency + interval + start date; task creates successfully.
  - `/tasks/:id/edit`: fields prefill; saving updates schedule.
  - `/tasks`: cards show next due + status; Refresh button reloads list.

## Notes / non-goals

- This does not add “Mark as completed” UI yet (endpoint exists); we can add a “Complete” action and a completion history panel next.

