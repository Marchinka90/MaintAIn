import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextareaField, TextField } from '../../components/Field'
import { useTasksData, type TaskDraft } from './useTasksData'

function emptyDraft(): TaskDraft {
  const today = new Date()
  const yyyy = String(today.getFullYear())
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return {
    title: '',
    description: '',
    category: 'Other',
    frequencyUnit: 'monthly',
    frequencyInterval: 1,
    startDate: `${yyyy}-${mm}-${dd}`,
    active: true,
  }
}

export function EditTaskPage() {
  const navigate = useNavigate()
  const params = useParams()
  const id = params.id ?? ''

  const {
    items,
    loading,
    loadTasks,
    error,
    setError,
    categories,
    categoriesReady,
    categoriesError,
    normalizeCategory,
    updateTask,
    deleteTask,
  } = useTasksData({ loadTasks: true })

  const task = useMemo(() => items.find((t) => t._id === id) ?? null, [id, items])

  const [draft, setDraft] = useState<TaskDraft>(emptyDraft())
  const [titleError, setTitleError] = useState<string | null>(null)
  const [intervalError, setIntervalError] = useState<string | null>(null)
  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!task) return
    setDraft({
      title: task.title ?? '',
      description: task.description ?? '',
      category: normalizeCategory(task.category ?? 'Other'),
      frequencyUnit: task.frequencyUnit ?? 'monthly',
      frequencyInterval: task.frequencyInterval ?? 1,
      startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : emptyDraft().startDate,
      active: task.active ?? true,
    })
  }, [normalizeCategory, task])

  async function onSave() {
    setTitleError(null)
    setIntervalError(null)
    setStartDateError(null)
    if (!draft.title.trim()) {
      setTitleError('Title is required')
      return
    }
    if (!Number.isFinite(draft.frequencyInterval) || draft.frequencyInterval < 1) {
      setIntervalError('Interval must be at least 1')
      return
    }
    if (!draft.startDate || Number.isNaN(new Date(draft.startDate).getTime())) {
      setStartDateError('Start date is required')
      return
    }
    if (!categoriesReady) {
      setError('Categories are still loading. Please try again in a moment.')
      return
    }

    setSubmitting(true)
    try {
      await updateTask(id, { ...draft, category: normalizeCategory(draft.category) })
      navigate('/tasks', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update task')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete() {
    const ok = window.confirm(`Delete task “${task?.title ?? 'this task'}”?`)
    if (!ok) return
    try {
      await deleteTask(id)
      navigate('/tasks', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Edit Task</h1>
            <p className="mt-2 text-sm text-slate-400">Update details, category, and active status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => void loadTasks()}>
              Refresh
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/tasks')}>
              Back to tasks
            </Button>
          </div>
        </header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!loading && !task ? (
          <Card className="p-6">
            <div className="text-lg font-medium text-slate-100">Task not found</div>
            <div className="mt-2 text-sm text-slate-400">It may have been deleted, or the URL is incorrect.</div>
            <div className="mt-5">
              <Button type="button" variant="primary" onClick={() => navigate('/tasks')}>
                Go to tasks
              </Button>
            </div>
          </Card>
        ) : null}

        {task ? (
          <Card className="p-6">
            <div className="space-y-4">
              <TextField
                label="Title"
                name="editTitle"
                value={draft.title}
                onChange={(value) => setDraft((d) => ({ ...d, title: value }))}
                autoComplete="off"
                required
                error={titleError}
              />

              <TextareaField
                label="Description"
                name="editDescription"
                value={draft.description}
                onChange={(value) => setDraft((d) => ({ ...d, description: value }))}
                autoComplete="off"
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2 md:items-end">
                <div className="space-y-1">
                  <label htmlFor="startDate" className="text-sm text-slate-400">
                    Start date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    required
                    className={[
                      'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                      'border-slate-700',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      startDateError ? 'border-rose-500/40' : '',
                    ].join(' ')}
                  />
                  {startDateError ? (
                    <p className="text-sm text-rose-300" role="alert">
                      {startDateError}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label htmlFor="frequencyUnit" className="text-sm text-slate-400">
                    Frequency
                  </label>
                  <select
                    id="frequencyUnit"
                    name="frequencyUnit"
                    value={draft.frequencyUnit}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, frequencyUnit: e.target.value as TaskDraft['frequencyUnit'] }))
                    }
                    required
                    className={[
                      'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                      'border-slate-700',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    ].join(' ')}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:items-end">
                <div className="space-y-1">
                  <label htmlFor="frequencyInterval" className="text-sm text-slate-400">
                    Interval
                  </label>
                  <input
                    id="frequencyInterval"
                    name="frequencyInterval"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={String(draft.frequencyInterval)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        frequencyInterval: e.target.value === '' ? 1 : Number(e.target.value),
                      }))
                    }
                    required
                    className={[
                      'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                      'border-slate-700',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      intervalError ? 'border-rose-500/40' : '',
                    ].join(' ')}
                  />
                  {intervalError ? (
                    <p className="text-sm text-rose-300" role="alert">
                      {intervalError}
                    </p>
                  ) : null}
                </div>
                <div />
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:items-end">
                <div className="space-y-1">
                  <label htmlFor="category" className="text-sm text-slate-400">
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
                      'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                      'border-slate-700',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    ].join(' ')}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {categoriesError ? (
                    <p className="text-sm text-rose-300" role="alert">
                      {categoriesError}
                    </p>
                  ) : null}
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  <input
                    name="active"
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => navigate('/tasks')} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={() => void onSave()} disabled={submitting || !categoriesReady}>
                  {submitting ? 'Saving…' : 'Save'}
                </Button>
                <Button type="button" variant="danger" onClick={() => void onDelete()} disabled={submitting}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  )
}

