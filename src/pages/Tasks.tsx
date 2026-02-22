import { useEffect, useMemo, useState } from 'react'
import './tasks.css'

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

type Draft = {
  title: string
  description: string
  category: string
  active: boolean
}

function emptyDraft(): Draft {
  return { title: '', description: '', category: '', active: true }
}

export function Tasks(props: { onBack: () => void }) {
  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft())

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks')
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

  async function createTask() {
    if (!draft.title.trim()) {
      setError('Title is required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || undefined,
          category: draft.category || undefined,
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
    setEditDraft({
      title: task.title ?? '',
      description: task.description ?? '',
      category: task.category ?? '',
      active: task.active ?? true,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(emptyDraft())
  }

  async function saveEdit(id: string) {
    if (!editDraft.title.trim()) {
      setError('Title is required')
      return
    }

    setError(null)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editDraft.title,
          description: editDraft.description || '',
          category: editDraft.category || '',
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
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
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
    <main className="tasksPage">
      <header className="tasksTopbar">
        <button type="button" className="ghostBtn" onClick={props.onBack}>
          ← Home
        </button>
        <div className="tasksTitle">
          <h2>Tasks</h2>
          <p>
            {items.length} total · {activeCount} active
          </p>
        </div>
        <button type="button" className="ghostBtn" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      <section className="tasksGrid">
        <section className="panel">
          <h3>Create task</h3>
          <div className="form">
            <label>
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Replace HVAC filter"
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Notes, steps, parts to buy…"
                rows={4}
              />
            </label>
            <div className="row">
              <label>
                <span>Category</span>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  placeholder="HVAC"
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="row">
              <button type="button" className="primaryBtn" disabled={submitting} onClick={() => void createTask()}>
                {submitting ? 'Creating…' : 'Create'}
              </button>
              <button type="button" className="ghostBtn" onClick={() => setDraft(emptyDraft())}>
                Clear
              </button>
            </div>
          </div>

          {error ? <div className="errorBox">{error}</div> : null}
        </section>

        <section className="panel">
          <h3>All tasks</h3>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && items.length === 0 ? <p className="muted">No tasks yet. Create your first one.</p> : null}

          <ul className="taskList">
            {items.map((t) => {
              const editing = editingId === t._id
              return (
                <li key={t._id} className="taskItem">
                  {editing ? (
                    <div className="taskEdit">
                      <div className="row">
                        <label>
                          <span>Title</span>
                          <input
                            value={editDraft.title}
                            onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                          />
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={editDraft.active}
                            onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.checked }))}
                          />
                          <span>Active</span>
                        </label>
                      </div>
                      <label>
                        <span>Description</span>
                        <textarea
                          value={editDraft.description}
                          onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                          rows={3}
                        />
                      </label>
                      <label>
                        <span>Category</span>
                        <input
                          value={editDraft.category}
                          onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                        />
                      </label>
                      <div className="row">
                        <button type="button" className="primaryBtn" onClick={() => void saveEdit(t._id)}>
                          Save
                        </button>
                        <button type="button" className="ghostBtn" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button type="button" className="dangerBtn" onClick={() => void deleteTask(t._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="taskView">
                      <div className="taskMeta">
                        <div className="taskTitleRow">
                          <div className="taskTitle">{t.title}</div>
                          <span className={`pill ${t.active ? 'pillActive' : 'pillInactive'}`}>
                            {t.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {t.category ? <div className="taskCategory">{t.category}</div> : null}
                        {t.description ? <div className="taskDesc">{t.description}</div> : null}
                      </div>
                      <div className="taskActions">
                        <button type="button" className="ghostBtn" onClick={() => startEdit(t)}>
                          Edit
                        </button>
                        <button type="button" className="dangerBtn" onClick={() => void deleteTask(t._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </section>
    </main>
  )
}

