---
name: backend-driven-task-categories
overview: "Make task categories backend-driven: add an API endpoint to fetch the predefined categories and enforce category validation on task create/update; update the frontend to fetch categories and render a required dropdown defaulting to “Other”."
todos:
  - id: backend-categories-constant
    content: Add `backend/src/constants/taskCategories.ts` with fixed categories list + validator helper.
    status: completed
  - id: backend-categories-endpoint
    content: "Add `GET /api/task-categories` endpoint in `backend/src/server.ts` (or a small router) returning `{ items: [...] }`."
    status: completed
  - id: backend-category-validation
    content: Update `backend/src/routes/tasks.ts` to require + validate `category` on POST and validate on PATCH.
    status: completed
  - id: frontend-fetch-categories
    content: Update `src/pages/Tasks.tsx` to fetch categories from `/api/task-categories` and manage loading/error states.
    status: completed
  - id: frontend-category-select
    content: Replace category text input with required `<select>` for both create and edit; default to `Other`.
    status: completed
  - id: check-build
    content: Run `npm run build` (frontend) and `backend/npm run build` to confirm compilation; quick smoke create/edit task.
    status: completed
isProject: false
---

# Backend-driven task categories + validation

## Goal

- Backend is the **source of truth** for allowed task categories.
- Frontend fetches categories and renders a **required** dropdown (default **Other**).
- Backend validates `category` on `POST /api/tasks` and `PATCH /api/tasks/:id`.
- No DB collection for categories (constant list in code).

## Allowed categories (fixed list)

- `Cleaning`
- `Appliances`
- `Bills`
- `Repairs`
- `Safety`
- `Other`

## Backend changes

### 1) Add categories constant

- Create `[backend/src/constants/taskCategories.ts](backend/src/constants/taskCategories.ts)` exporting `TASK_CATEGORIES` and a helper `isValidTaskCategory(value: unknown): value is TaskCategory`.

### 2) Add categories endpoint

- Add `GET /api/task-categories` returning:
  - `{ items: ["Cleaning", "Appliances", ...] }`
- Wire it in `[backend/src/server.ts](backend/src/server.ts)` (near existing `/api/health` and `/api/tasks`).

### 3) Validate category on task write

- Update `[backend/src/routes/tasks.ts](backend/src/routes/tasks.ts)`:
  - **POST**: require `category` to be present and one of the allowed values (currently category is optional string:

```43:72:backend/src/routes/tasks.ts
if (!isOptionalString(body.category)) return res.status(400).json({ error: 'category must be a string' })
// ...
category: typeof body.category === 'string' ? body.category : undefined,
```

- **PATCH**: if `category` is provided, validate it; also allow setting it to a valid category only.
- Return `400` with a clear message like `category must be one of: Cleaning, Appliances, ...`.

## Frontend changes

### 1) Fetch categories

- Update `[src/pages/Tasks.tsx](src/pages/Tasks.tsx)` to fetch categories on mount:
  - `GET /api/task-categories`
  - Keep local state: `categories`, `categoriesLoading`, `categoriesError`

### 2) Replace free-text category with select

- In create form:
  - Replace the category `TextField` with a `<select>` populated from fetched categories.
  - Make it **required**; default to **Other** after categories load.

### 3) Edit form

- Same select for editing.
- Since you stated there are currently **no tasks in DB**, we won’t add migration logic; but the UI will still safely handle missing categories by falling back to `Other`.

## Verification

- Backend:
  - `GET /api/task-categories` returns the list.
  - `POST /api/tasks` fails with `400` if category missing/invalid.
  - `PATCH /api/tasks/:id` fails with `400` if category invalid.
- Frontend:
  - Category dropdown loads from backend.
  - Create/edit requires category and defaults to `Other`.
  - `npm run build` passes.

