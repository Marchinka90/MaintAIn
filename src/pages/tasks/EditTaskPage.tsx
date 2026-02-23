import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          tone="light"
          onClick={() => void loadTasks()}
        >
          Refresh
        </Button>
        <Button
          type="button"
          variant="ghost"
          tone="light"
          onClick={() => navigate('/tasks')}
        >
          Back to tasks
        </Button>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {!loading && !task ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-lg font-semibold text-slate-900">Task not found</div>
          <div className="mt-2 text-sm text-slate-600">It may have been deleted, or the URL is incorrect.</div>
          <div className="mt-5">
            <Button type="button" variant="primary" tone="light" onClick={() => navigate('/tasks')}>
              Go to tasks
            </Button>
          </div>
        </Card>
      ) : null}

      {task ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="editTitle" className="text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="editTitle"
                name="editTitle"
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                autoComplete="off"
                required
                aria-invalid={Boolean(titleError) || undefined}
                className={[
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                  titleError ? 'border-rose-300' : 'border-slate-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                ].join(' ')}
              />
              {titleError ? (
                <p className="text-sm text-rose-700" role="alert">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="editDescription" className="text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="editDescription"
                name="editDescription"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                autoComplete="off"
                className={[
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                  'border-slate-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                ].join(' ')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:items-end">
              <div className="space-y-1">
                <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
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
                    'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                    startDateError ? 'border-rose-300' : 'border-slate-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                  ].join(' ')}
                />
                {startDateError ? (
                  <p className="text-sm text-rose-700" role="alert">
                    {startDateError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="frequencyUnit" className="text-sm font-medium text-slate-700">
                  Frequency
                </label>
                <select
                  id="frequencyUnit"
                  name="frequencyUnit"
                  value={draft.frequencyUnit}
                  onChange={(e) => setDraft((d) => ({ ...d, frequencyUnit: e.target.value as TaskDraft['frequencyUnit'] }))}
                  required
                  className={[
                    'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                    'border-slate-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
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
                <label htmlFor="frequencyInterval" className="text-sm font-medium text-slate-700">
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
                    'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                    intervalError ? 'border-rose-300' : 'border-slate-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                  ].join(' ')}
                />
                {intervalError ? (
                  <p className="text-sm text-rose-700" role="alert">
                    {intervalError}
                  </p>
                ) : null}
              </div>
              <div />
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:items-end">
              <div className="space-y-1">
                <label htmlFor="category" className="text-sm font-medium text-slate-700">
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
                    'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                    'border-slate-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                    !categoriesReady ? 'opacity-70' : '',
                  ].join(' ')}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {categoriesError ? (
                  <p className="text-sm text-rose-700" role="alert">
                    {categoriesError}
                  </p>
                ) : null}
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  name="active"
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                tone="light"
                onClick={() => navigate('/tasks')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                tone="light"
                onClick={() => void onSave()}
                disabled={submitting || !categoriesReady}
              >
                {submitting ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="danger"
                tone="light"
                onClick={() => void onDelete()}
                disabled={submitting}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

