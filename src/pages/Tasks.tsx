import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { CreateTaskCard } from './tasks/CreateTaskCard'
import { DashboardHeader } from './tasks/DashboardHeader'
import { TaskList } from './tasks/TaskList'

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
  const overdueCount = 0
  const dueSoonCount = 0
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
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader
          title="Tasks"
          subtitle={`${items.length} total · ${activeCount} active`}
          username={user?.username}
          overdue={overdueCount}
          dueSoon={dueSoonCount}
          active={activeCount}
          onBack={props.onBack}
          onRefresh={() => void load()}
          onLogout={() => void logout()}
        />

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <CreateTaskCard
            draft={draft}
            onDraftChange={(next) => setDraft(next)}
            onSubmit={() => void createTask()}
            onClear={() => setDraft(emptyDraft())}
            submitting={submitting}
            titleError={createTitleError}
            categories={categories}
            categoriesReady={categoriesReady}
            categoriesError={categoriesError}
            normalizeCategory={normalizeCategory}
          />

          <TaskList
            items={items}
            loading={loading}
            editingId={editingId}
            editDraft={editDraft}
            editTitleError={editTitleError}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={(id) => void saveEdit(id)}
            onDelete={(id) => void deleteTask(id)}
            onEditDraftChange={(next) => setEditDraft(next)}
            categories={categories}
            categoriesReady={categoriesReady}
            normalizeCategory={normalizeCategory}
          />
        </div>
      </div>
    </main>
  )
}

