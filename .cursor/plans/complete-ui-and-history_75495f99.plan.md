---
name: complete-ui-and-history
overview: Add a task “Complete” action (modal with completedAt/note/cost) and an expandable completion-history panel per task card, using existing `/api/tasks/:id/complete` and a small new backend endpoint to list completions.
todos:
  - id: be-completions-endpoint
    content: Add `GET /api/tasks/:id/completions` with ownership check, sorting, and limit in `backend/src/routes/tasks.ts`.
    status: completed
  - id: fe-api-complete-and-history
    content: Extend `src/pages/tasks/useTasksData.ts` with `completeTask()` and `fetchCompletions()` plus `CompletionItem` type.
    status: completed
  - id: fe-complete-modal
    content: Implement `CompleteTaskModal` (datetime-local, note, cost) and wire it from `TaskList`.
    status: completed
  - id: fe-task-card-history-panel
    content: Add History toggle + cached fetch/render of completions inside each task card in `src/pages/tasks/TaskList.tsx`.
    status: completed
  - id: fe-wire-from-page
    content: Update `src/pages/tasks/TasksListPage.tsx` to pass complete/history functions into `TaskList`, and refresh tasks after completion.
    status: completed
isProject: false
---

# Complete action + completion history UI

## Goals

- Add **“Complete”** action on each task card that opens a modal (optional **note**, **cost**, **completedAt**) and calls `POST /api/tasks/:id/complete`.
- Add an **expandable completion history panel** inside each task card (cached per task), showing recent completions.
- Keep existing routing/business logic intact; only extend with new endpoints/UI.

## What exists already

- Backend completion write endpoint in [backend/src/routes/tasks.ts](backend/src/routes/tasks.ts):

```246:277:backend/src/routes/tasks.ts
tasksRouter.post('/:id/complete', async (req, res) => {
  // ... validate completedAt/note/cost ...
  const task = await Task.findOne({ _id: id, ownerUserId: req.user!.userId })
  // ... create Completion ...
  const nextDueDate = addInterval(completedAt, task.frequencyUnit, task.frequencyInterval)
  task.lastCompletedAt = completedAt
  task.nextDueDate = nextDueDate
  await task.save()
  res.json({ task: task.toObject(), completion: completion.toObject() })
})
```

## Backend changes

- Add **read endpoint** for history in [backend/src/routes/tasks.ts](backend/src/routes/tasks.ts):
  - `GET /api/tasks/:id/completions?limit=20`
  - Auth: covered by `tasksRouter.use(requireAuth)`
  - Ownership: first verify the task exists for `ownerUserId = req.user!.userId`, then query completions by `taskId`.
  - Return shape: `{ items: completions }` sorted by `completedAt` desc.
  - Validate `limit` (clamp 1–100; default 20).

## Frontend changes

### Data/API layer

- Extend [src/pages/tasks/useTasksData.ts](src/pages/tasks/useTasksData.ts) with:
  - `type CompletionItem = { _id: string; completedAt: string; note?: string; cost?: number; createdAt?: string; updatedAt?: string }`
  - `fetchCompletions(taskId: string, limit?: number): Promise<CompletionItem[]>`
  - `completeTask(taskId: string, payload: { completedAt?: string; note?: string; cost?: number }): Promise<{ task: TaskItem; completion: CompletionItem }>`
  - Use `authFetch` for both.

### UI: Task list card actions

- Update [src/pages/tasks/TasksListPage.tsx](src/pages/tasks/TasksListPage.tsx) to pass `completeTask` and `fetchCompletions` down into `TaskList`.
- Update [src/pages/tasks/TaskList.tsx](src/pages/tasks/TaskList.tsx):
  - Add a **Complete** button per task (disabled if `!task.active`).
  - Add a **History** toggle button per task.
  - Maintain local state:
    - `modalTaskId` + modal draft fields (`completedAt`, `note`, `cost`, `submitting`).
    - `expandedTaskIds: Set<string>`.
    - `completionsByTaskId: Record<string, CompletionItem[]>` and `loadingByTaskId`.
  - On expand:
    - If not cached, call `fetchCompletions(taskId)` and store.
  - On complete submit:
    - Call `completeTask(taskId, payload)`.
    - Close modal.
    - Update history cache for that task by unshifting returned `completion` (and optionally auto-expand history).
    - Call `onRefresh()` to reload tasks so `nextDueDate` updates/re-sorts.

### Modal implementation

- Add a small reusable modal component (suggested new file):
  - [src/pages/tasks/CompleteTaskModal.tsx](src/pages/tasks/CompleteTaskModal.tsx) (or `src/components/`)
  - Overlay: `fixed inset-0 bg-black/50` + centered `Card` styling to match current dark UI.
  - Fields:
    - `completedAt` input `type="datetime-local"` (default `new Date().toISOString().slice(0, 16)`).
    - `cost` input `type="number"` (`min=0`, `step=0.01`, optional).
    - `note` using existing `TextareaField`.
  - Close behaviors: Cancel button, clicking backdrop, Escape.

## Notes / pitfalls handled

- Ensure **all** completion API calls go through `authFetch` (not bare `fetch`).
- Convert `datetime-local` to an ISO string on submit (e.g. `new Date(localValue).toISOString()`), since backend accepts date strings.
- History endpoint must enforce task ownership (Completion docs do not carry `ownerUserId`).

```mermaid
defSequenceDiagram
sequenceDiagram
  participant UI as TaskCardUI
  participant FE as FrontendAPI
  participant BE as Backend
  participant DB as MongoDB

  UI->>FE: openModal(taskId)
  UI->>FE: POST_/api/tasks/:id/complete
  FE->>BE: authFetch(complete)
  BE->>DB: insert Completion
  BE->>DB: update Task(nextDueDate,lastCompletedAt)
  BE-->>FE: {task,completion}
  FE-->>UI: closeModal + updateHistoryCache + refreshTasks
  UI->>FE: GET_/api/tasks/:id/completions
  FE->>BE: authFetch(completions)
  BE->>DB: find completions by taskId
  BE-->>FE: {items}
  FE-->>UI: render history
```



