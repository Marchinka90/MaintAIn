---
name: Recurring scheduling + completions
overview: Extend the existing Express/Mongoose tasks API with recurrence fields, a Completion collection, a mark-complete endpoint, and status-based filtering—without breaking existing routes or auth scoping.
todos:
  - id: recurrence-lib
    content: Add `backend/src/lib/recurrence.ts` with addInterval + clamping edge cases.
    status: completed
  - id: task-model-extend
    content: Extend `backend/src/models/Task.ts` with startDate/nextDueDate/lastCompletedAt and required recurrence defaults + indexes.
    status: completed
  - id: completion-model
    content: Create `backend/src/models/Completion.ts` schema/model with indexes.
    status: completed
  - id: tasks-filtering
    content: Update `GET /api/tasks` to support status/dueSoonDays/q + sort by nextDueDate asc, keeping existing filters.
    status: completed
  - id: task-write-compute
    content: Update POST/PATCH tasks to compute nextDueDate on create and when recurrence changes.
    status: completed
  - id: complete-endpoint
    content: Add POST `/api/tasks/:id/complete` to log completion and advance nextDueDate.
    status: completed
  - id: verify-backend
    content: Build backend and smoke-test endpoints/filters with auth scoping.
    status: completed
isProject: false
---

## Context (current backend)

- Tasks are owned per user via `ownerUserId` and protected by `requireAuth`.
- Existing recurrence fields already exist but are optional and **lowercase**: `frequencyUnit: 'weekly'|'monthly'|'yearly'` and `frequencyInterval`.
- `GET /api/tasks` currently filters by `active` and `category` only and sorts by `updatedAt` desc.

You confirmed:

- Keep **existing lowercase** unit values and `frequencyInterval` field name.
- No existing tasks in DB → no migration/backfill needed.

## Implementation plan

### 1) Add recurrence engine module

Create `[backend/src/lib/recurrence.ts](backend/src/lib/recurrence.ts)`:

- `addInterval(date: Date, unit: 'weekly'|'monthly'|'yearly', interval: number): Date`
  - Weekly: add `interval * 7` days.
  - Monthly/yearly: UTC-safe month/year arithmetic with clamping for month-end and leap-year (e.g., Jan 31 + 1 month → Feb 28/29).
- `calculateNextDueDate(completedAt: Date, unit: ..., interval: number): Date` (thin wrapper over `addInterval`).

### 2) Extend Task model (Mongoose)

Update `[backend/src/models/Task.ts](backend/src/models/Task.ts)`:

- Make recurrence fields required with defaults (staying consistent with current API):
  - `frequencyUnit`: required, default `'monthly'`
  - `frequencyInterval`: required, default `1` (min 1)
- Add scheduling fields:
  - `startDate`: required, default `Date.now`
  - `nextDueDate`: required (set on create; also recomputed when recurrence/startDate changes)
  - `lastCompletedAt`: optional
- Add helpful indexes (in addition to existing `ownerUserId` index):
  - compound index e.g. `{ ownerUserId: 1, active: 1, category: 1, nextDueDate: 1 }`
  - plus `{ ownerUserId: 1, nextDueDate: 1 }` for default sorting

### 3) Add Completion model (separate collection)

Create `[backend/src/models/Completion.ts](backend/src/models/Completion.ts)`:

- `taskId`: ObjectId ref `Task` (required, indexed)
- `completedAt`: Date (required, default now, indexed)
- `note`: optional string
- `cost`: optional number (min 0)
- timestamps

### 4) Extend `GET /api/tasks` with status + filtering + sorting

Update `[backend/src/routes/tasks.ts](backend/src/routes/tasks.ts)`:

- Support query params:
  - `category=...`
  - `active=true|false` (keep existing)
  - `isActive=true|false` (alias; if present, overrides `active`)
  - `status=overdue|dueSoon|upcoming`
  - `dueSoonDays=7` (only used for dueSoon/upcoming; clamp to reasonable range)
  - `q=...` case-insensitive search on title/description via regex
- Status rules (Date comparisons are UTC-safe at millisecond level):
  - `overdue`: `active=true` AND `nextDueDate < now`
  - `dueSoon`: `active=true` AND `nextDueDate in [now, now + dueSoonDays]`
  - `upcoming`: `active=true` AND `nextDueDate > now + dueSoonDays`
- Default sort becomes `nextDueDate` ascending (per requirement).

### 5) Compute `nextDueDate` on create/update

Update `POST /api/tasks` and `PATCH /api/tasks/:id` in `[backend/src/routes/tasks.ts](backend/src/routes/tasks.ts)`:

- **POST**:
  - Accept optional `startDate` (if provided, validate parseable Date).
  - Use `frequencyUnit` + `frequencyInterval` (defaulted if missing).
  - Compute `nextDueDate = addInterval(startDate, unit, interval)`.
- **PATCH**:
  - Allow updating `frequencyUnit`, `frequencyInterval`, `startDate`, `active`, `category`, `title`, `description`.
  - If any of `{frequencyUnit, frequencyInterval, startDate}` changed (or `nextDueDate` missing), recompute:
    - base date = `lastCompletedAt ?? startDate`
    - `nextDueDate = addInterval(baseDate, unit, interval)`
  - Do not allow direct `nextDueDate` writes from the client (keeps business logic consistent).

### 6) Add completion endpoint

Add `POST /api/tasks/:id/complete` to `[backend/src/routes/tasks.ts](backend/src/routes/tasks.ts)`:

- Validate body: `{ completedAt?, note?, cost? }`.
- Find the task by `{ _id, ownerUserId }` (keep per-user scoping).
- Create `Completion` record.
- Compute `newNextDueDate = addInterval(completedAt, task.frequencyUnit, task.frequencyInterval)`.
- Update task: `lastCompletedAt = completedAt`, `nextDueDate = newNextDueDate`.
- Return `{ task, completion }`.
- Errors:
  - 404 if task not found
  - 400 if invalid input

### 7) Verification

- Backend build: `cd backend && npm run build`
- Manual API checks (curl/Postman):
  - Create task → response includes `startDate`, `nextDueDate`, defaults set
  - `GET /api/tasks?status=overdue|dueSoon|upcoming&dueSoonDays=7`
  - `POST /api/tasks/:id/complete` creates completion + advances `nextDueDate`
  - Ensure all operations remain scoped by `ownerUserId`

## Files touched

- Add: `backend/src/lib/recurrence.ts`
- Update: `backend/src/models/Task.ts`
- Add: `backend/src/models/Completion.ts`
- Update: `backend/src/routes/tasks.ts`

## Notes

- This plan intentionally keeps your existing field names (`frequencyUnit`, `frequencyInterval`, `active`) to avoid breaking current clients; it implements the requested behavior with those names (instead of switching to `WEEK|MONTH|YEAR` and `isActive`).

