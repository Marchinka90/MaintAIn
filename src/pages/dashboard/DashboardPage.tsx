import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CompleteTaskModal } from '../tasks/CompleteTaskModal'
import { TaskCard } from '../tasks/TaskCard'
import { nowLocalDateTimeValue } from '../tasks/taskUi'
import { useTasksData, type TaskItem } from '../tasks/useTasksData'

const DUE_SOON_DAYS = 7

function isFiniteTime(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value)
}

function parseTime(value?: string) {
  if (!value) return null
  const t = new Date(value).getTime()
  return isFiniteTime(t) ? t : null
}

function computeOverdueAndDueSoon(items: { active: boolean; nextDueDate?: string }[], dueSoonDays = DUE_SOON_DAYS) {
  const now = Date.now()
  const soon = now + dueSoonDays * 24 * 60 * 60 * 1000
  let overdue = 0
  let dueSoon = 0
  for (const t of items) {
    if (!t.active) continue
    const due = parseTime(t.nextDueDate)
    if (due == null) continue
    if (due < now) overdue++
    else if (due <= soon) dueSoon++
  }
  return { overdue, dueSoon }
}

function pickTop(items: TaskItem[], kind: 'overdue' | 'dueSoon', limit = 5, dueSoonDays = DUE_SOON_DAYS) {
  const now = Date.now()
  const soon = now + dueSoonDays * 24 * 60 * 60 * 1000
  const filtered = items.filter((t) => {
    if (!t.active) return false
    const due = parseTime(t.nextDueDate)
    if (due == null) return false
    if (kind === 'overdue') return due < now
    return due >= now && due <= soon
  })
  filtered.sort((a, b) => {
    const at = parseTime(a.nextDueDate) ?? 0
    const bt = parseTime(b.nextDueDate) ?? 0
    return at - bt
  })
  return filtered.slice(0, limit)
}

type CompleteDraft = { completedAtLocal: string; cost: string; note: string }

export function DashboardPage() {
  const navigate = useNavigate()
  const { items, loading, error, setError, loadTasks, deleteTask, completeTask } = useTasksData({ loadTasks: false })

  useEffect(() => {
    void loadTasks({ active: 'true' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items])
  const { overdue: overdueCount, dueSoon: dueSoonCount } = useMemo(() => computeOverdueAndDueSoon(items, DUE_SOON_DAYS), [items])

  const topOverdue = useMemo(() => pickTop(items, 'overdue', 5, DUE_SOON_DAYS), [items])
  const topDueSoon = useMemo(() => pickTop(items, 'dueSoon', 5, DUE_SOON_DAYS), [items])

  const [modalTaskId, setModalTaskId] = useState<string | null>(null)
  const modalTask = useMemo(() => items.find((t) => t._id === modalTaskId) ?? null, [items, modalTaskId])
  const [completeDraft, setCompleteDraft] = useState<CompleteDraft>(() => ({
    completedAtLocal: nowLocalDateTimeValue(),
    cost: '',
    note: '',
  }))
  const [completeSubmitting, setCompleteSubmitting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  function openCompleteModal(id: string) {
    setCompleteError(null)
    setModalTaskId(id)
    setCompleteDraft({ completedAtLocal: nowLocalDateTimeValue(), cost: '', note: '' })
  }

  function closeCompleteModal() {
    setModalTaskId(null)
  }

  async function submitComplete() {
    if (!modalTaskId) return
    setCompleteError(null)

    let completedAt: string | undefined = undefined
    if (completeDraft.completedAtLocal.trim()) {
      const d = new Date(completeDraft.completedAtLocal)
      if (!Number.isNaN(d.getTime())) completedAt = d.toISOString()
    }

    let cost: number | undefined = undefined
    if (completeDraft.cost.trim()) {
      const n = Number(completeDraft.cost)
      if (!Number.isFinite(n)) {
        setCompleteError('Cost must be a number')
        return
      }
      if (n < 0) {
        setCompleteError('Cost must be >= 0')
        return
      }
      cost = n
    }

    const note = completeDraft.note.trim() ? completeDraft.note : undefined

    setCompleteSubmitting(true)
    try {
      await completeTask(modalTaskId, { completedAt, note, cost })
      closeCompleteModal()
      await loadTasks({ active: 'true' })
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : 'Failed to complete task')
    } finally {
      setCompleteSubmitting(false)
    }
  }

  async function onDelete(id: string) {
    const task = items.find((t) => t._id === id)
    const ok = window.confirm(`Delete task “${task?.title ?? 'this task'}”?`)
    if (!ok) return
    try {
      await deleteTask(id)
      await loadTasks({ active: 'true' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  function Section(props: { title: string; subtitle: string; empty: string; items: TaskItem[] }) {
    return (
      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            <div className="mt-1 text-sm text-slate-600">{props.subtitle}</div>
          </div>
          <Button type="button" variant="ghost" tone="light" onClick={() => navigate('/tasks')}>
            View all
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {!loading && props.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">{props.empty}</div>
          ) : null}
          {props.items.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              showHistory={false}
              onComplete={() => openCompleteModal(t._id)}
              onEdit={() => navigate(`/tasks/${t._id}/edit`)}
              onDelete={() => void onDelete(t._id)}
            />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Overdue</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-rose-600">{overdueCount}</div>
          <div className="mt-1 text-sm text-slate-500">Needs attention</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Due Soon</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-amber-600">{dueSoonCount}</div>
          <div className="mt-1 text-sm text-slate-500">Next {DUE_SOON_DAYS} days</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Active Tasks</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{activeCount}</div>
          <div className="mt-1 text-sm text-slate-500">Currently tracked</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Completed</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">0</div>
          <div className="mt-1 text-sm text-slate-500">This month (placeholder)</div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="primary" tone="light" onClick={() => navigate('/tasks')}>
          View All Tasks
        </Button>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Overdue Tasks"
          subtitle="Up to 5 tasks that need attention first."
          empty="No overdue tasks. Nice work."
          items={topOverdue}
        />
        <Section
          title="Due Soon"
          subtitle={`Up to 5 tasks due within the next ${DUE_SOON_DAYS} days.`}
          empty="Nothing due soon. You’re ahead of schedule."
          items={topDueSoon}
        />
      </div>

      <CompleteTaskModal
        open={Boolean(modalTaskId)}
        title={modalTask ? `Complete “${modalTask.title}”` : 'Complete task'}
        draft={completeDraft}
        submitting={completeSubmitting}
        error={completeError}
        onDraftChange={setCompleteDraft}
        onClose={closeCompleteModal}
        onSubmit={() => void submitComplete()}
      />
    </div>
  )
}

