import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { CreateTaskCard } from './CreateTaskCard'
import { useTasksData, type TaskDraft } from './useTasksData'

function emptyDraft(): TaskDraft {
  return { title: '', description: '', category: 'Other', active: true }
}

export function CreateTaskPage() {
  const navigate = useNavigate()
  const {
    categories,
    categoriesReady,
    categoriesError,
    normalizeCategory,
    createTask,
    setError,
    error,
  } = useTasksData({ loadTasks: false })

  const [draft, setDraft] = useState<TaskDraft>(emptyDraft())
  const [titleError, setTitleError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit() {
    setTitleError(null)
    if (!draft.title.trim()) {
      setTitleError('Title is required')
      return
    }
    if (!categoriesReady) {
      setError('Categories are still loading. Please try again in a moment.')
      return
    }

    setSubmitting(true)
    try {
      await createTask({ ...draft, category: normalizeCategory(draft.category) })
      navigate('/tasks', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100">New Task</h1>
            <p className="mt-2 text-sm text-slate-400">Create a task you want to keep on a schedule.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/tasks')}>
              Back to tasks
            </Button>
          </div>
        </header>

        <CreateTaskCard
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={() => void onSubmit()}
          onClear={() => setDraft(emptyDraft())}
          submitting={submitting}
          titleError={titleError}
          categories={categories}
          categoriesReady={categoriesReady}
          categoriesError={categoriesError}
          normalizeCategory={normalizeCategory}
        />

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  )
}

