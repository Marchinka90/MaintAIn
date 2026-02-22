import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { TextareaField, TextField } from '../components/Field'
import { useAuth } from '../auth/AuthContext'

export type TaskItem = {
  _id: string
  title: string
  description?: string
  category?: string
  active: boolean
  frequencyUnit?: 'weekly' | 'monthly' | 'yearly'
  frequencyInterval?: number
  createdAt?: string
  updatedAt?: string
}

type TasksResponse = { items: TaskItem[] }
type TaskResponse = { item: TaskItem }
type CategoriesResponse = { items: string[] }

type Draft = {
  title: string
  description: string
  category: string
  active: boolean
}

function emptyDraft(): Draft {
  return { title: '', description: '', category: 'Other', active: true }
}

export function Tasks(props: { onBack: () => void }) {
  const { authFetch, logout, user } = useAuth()
  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTitleError, setCreateTitleError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft())
  const [editTitleError, setEditTitleError] = useState<string | null>(null)

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items])
  const categoriesReady = !categoriesLoading && categories.length > 0

  function normalizeCategory(value: string) {
    if (!categoriesReady) return value || 'Other'
    if (categories.includes(value)) return value
    if (categories.includes('Other')) return 'Other'
    return categories[0] ?? 'Other'
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/tasks')
      const data = (await res.json()) as TasksResponse
      if (!res.ok) throw new Error('Failed to load tasks')
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!categoriesReady) return
    setDraft((d) => ({ ...d, category: normalizeCategory(d.category) }))
    setEditDraft((d) => ({ ...d, category: normalizeCategory(d.category) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesReady, categories.join('|')])

  useEffect(() => {
    let cancelled = false

    setCategoriesLoading(true)
    setCategoriesError(null)
    fetch('/api/task-categories')
      .then(async (res) => {
        const data = (await res.json()) as CategoriesResponse
        if (cancelled) return
        if (!res.ok) throw new Error('Failed to load categories')
        setCategories(Array.isArray(data.items) ? data.items : [])
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setCategoriesError(e instanceof Error ? e.message : 'Failed to load categories')
        setCategories([])
      })
      .finally(() => {
        if (cancelled) return
        setCategoriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function createTask() {
    setCreateTitleError(null)
    if (!draft.title.trim()) {
      setCreateTitleError('Title is required')
      return
    }
    if (!categoriesReady) {
      setError('Categories are still loading. Please try again in a moment.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || undefined,
          category: normalizeCategory(draft.category),
          active: draft.active,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to create task')
      }
      const data = (await res.json()) as TaskResponse
      setItems((prev) => [data.item, ...prev])
      setDraft(emptyDraft())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(task: TaskItem) {
    setEditingId(task._id)
    setEditTitleError(null)
    setEditDraft({
      title: task.title ?? '',
      description: task.description ?? '',
      category: normalizeCategory(task.category ?? 'Other'),
      active: task.active ?? true,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitleError(null)
    setEditDraft(emptyDraft())
  }

  async function saveEdit(id: string) {
    setEditTitleError(null)
    if (!editDraft.title.trim()) {
      setEditTitleError('Title is required')
      return
    }
    if (!categoriesReady) {
      setError('Categories are still loading. Please try again in a moment.')
      return
    }

    setError(null)
    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editDraft.title,
          description: editDraft.description || '',
          category: normalizeCategory(editDraft.category),
          active: editDraft.active,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to update task')
      }
      const data = (await res.json()) as TaskResponse
      setItems((prev) => prev.map((t) => (t._id === id ? data.item : t)))
      cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update task')
    }
  }

  async function deleteTask(id: string) {
    const task = items.find((t) => t._id === id)
    const ok = window.confirm(`Delete task “${task?.title ?? 'this task'}”?`)
    if (!ok) return

    setError(null)
    try {
      const res = await authFetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to delete task')
      }
      setItems((prev) => prev.filter((t) => t._id !== id))
      if (editingId === id) cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  return (
    <main className="min-h-dvh px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={props.onBack} aria-label="Go to home">
            ← Home
          </Button>

          <div className="min-w-0 text-center">
            <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
            <p className="mt-1 text-xs text-white/60">
              {items.length} total · {activeCount} active{user ? ` · ${user.username}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => void load()} aria-label="Refresh tasks">
              Refresh
            </Button>
            <Button type="button" variant="ghost" onClick={() => void logout()} aria-label="Log out">
              Logout
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-tight">Create Task</h3>
            <div className="mt-4 grid gap-3">
              <TextField
                label="Title"
                name="title"
                value={draft.title}
                onChange={(value) => setDraft((d) => ({ ...d, title: value }))}
                placeholder="Replace HVAC filter"
                autoComplete="off"
                required
                error={createTitleError}
              />
              <TextareaField
                label="Description"
                name="description"
                value={draft.description}
                onChange={(value) => setDraft((d) => ({ ...d, description: value }))}
                placeholder="Notes, steps, parts to buy…"
                autoComplete="off"
              />
              <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                <div className="grid gap-1.5">
                  <label htmlFor="category" className="text-xs font-medium text-white/70">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={normalizeCategory(draft.category)}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    disabled={!categoriesReady}
                    required
                    className={[
                      'w-full rounded-xl border px-3 py-2 text-sm text-(--fg)',
                      'border-white/15 bg-black/15',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)',
                    ].join(' ')}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {categoriesError ? (
                    <p className="text-xs text-rose-200" role="alert">
                      {categoriesError}
                    </p>
                  ) : null}
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-sm">
                  <input
                    name="active"
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                    className="h-4 w-4 accent-(--accent)"
                  />
                  <span className="text-white/85">Active</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  disabled={submitting || !categoriesReady}
                  onClick={() => void createTask()}
                >
                  {submitting ? 'Creating…' : 'Create'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setDraft(emptyDraft())}>
                  Clear
                </Button>
              </div>

              {error ? (
                <div role="alert" className="rounded-xl border border-rose-300/35 bg-rose-300/10 px-3 py-2 text-sm">
                  {error}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold tracking-tight">All Tasks</h3>
              {loading ? <span className="text-xs text-white/60">Loading…</span> : null}
            </div>

            {!loading && items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No tasks yet. Create your first one to get started.
              </div>
            ) : null}

            <ul className="mt-4 grid gap-3">
              {items.map((t) => {
                const editing = editingId === t._id
                return (
                  <li
                    key={t._id}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4 shadow-[0_14px_50px_var(--shadow)]"
                  >
                    {editing ? (
                      <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <TextField
                            label="Title"
                            name="editTitle"
                            value={editDraft.title}
                            onChange={(value) => setEditDraft((d) => ({ ...d, title: value }))}
                            autoComplete="off"
                            required
                            error={editTitleError}
                          />
                          <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-sm">
                            <input
                              name="editActive"
                              type="checkbox"
                              checked={editDraft.active}
                              onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.checked }))}
                              className="h-4 w-4 accent-(--accent)"
                            />
                            <span className="text-white/85">Active</span>
                          </label>
                        </div>

                        <TextareaField
                          label="Description"
                          name="editDescription"
                          value={editDraft.description}
                          onChange={(value) => setEditDraft((d) => ({ ...d, description: value }))}
                          autoComplete="off"
                          rows={3}
                        />
                        <div className="grid gap-1.5">
                          <label htmlFor="editCategory" className="text-xs font-medium text-white/70">
                            Category
                          </label>
                          <select
                            id="editCategory"
                            name="editCategory"
                            value={normalizeCategory(editDraft.category)}
                            onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                            disabled={!categoriesReady}
                            required
                            className={[
                              'w-full rounded-xl border px-3 py-2 text-sm text-(--fg)',
                              'border-white/15 bg-black/15',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)',
                            ].join(' ')}
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            variant="primary"
                            disabled={!categoriesReady}
                            onClick={() => void saveEdit(t._id)}
                          >
                            Save
                          </Button>
                          <Button type="button" variant="ghost" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button type="button" variant="danger" onClick={() => void deleteTask(t._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="min-w-0 wrap-break-word text-sm font-semibold tracking-tight">
                              {t.title}
                            </div>
                            <span
                              className={[
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                                t.active
                                  ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-50'
                                  : 'border-white/15 bg-white/5 text-white/70',
                              ].join(' ')}
                            >
                              {t.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {t.category ? <div className="mt-1 text-xs text-white/60">{t.category}</div> : null}
                          {t.description ? (
                            <div className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-white/80">
                              {t.description}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <Button type="button" variant="ghost" onClick={() => startEdit(t)}>
                            Edit
                          </Button>
                          <Button type="button" variant="danger" onClick={() => void deleteTask(t._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </main>
  )
}

