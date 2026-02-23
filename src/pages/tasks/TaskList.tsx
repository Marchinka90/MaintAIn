import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CompleteTaskModal } from './CompleteTaskModal'
import type { CompletionItem, TaskItem } from './useTasksData'

function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatFrequency(unit?: TaskItem['frequencyUnit'], interval?: number) {
  const u = unit ?? 'monthly'
  const n = typeof interval === 'number' && Number.isFinite(interval) && interval >= 1 ? interval : 1
  const label = u === 'weekly' ? 'week' : u === 'yearly' ? 'year' : 'month'
  return n === 1 ? `Every ${label}` : `Every ${n} ${label}s`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

function nowLocalDateTimeValue() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

type StatusKind = 'inactive' | 'overdue' | 'dueSoon' | 'upcoming'

function computeStatus(task: TaskItem, dueSoonDays = 7): StatusKind {
  if (!task.active) return 'inactive'
  if (!task.nextDueDate) return 'upcoming'
  const due = new Date(task.nextDueDate).getTime()
  if (Number.isNaN(due)) return 'upcoming'
  const now = Date.now()
  if (due < now) return 'overdue'
  const soon = now + dueSoonDays * 24 * 60 * 60 * 1000
  if (due <= soon) return 'dueSoon'
  return 'upcoming'
}

function StatusBadge(props: { kind: StatusKind }) {
  const styles: Record<StatusKind, string> = {
    inactive: 'border-slate-700 bg-slate-800 text-slate-300',
    overdue: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    dueSoon: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    upcoming: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  }
  const label: Record<StatusKind, string> = {
    inactive: 'Inactive',
    overdue: 'Overdue',
    dueSoon: 'Due soon',
    upcoming: 'Upcoming',
  }
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[props.kind]}`}>{label[props.kind]}</span>
  )
}

function Badge(props: { kind: 'active' | 'inactive' }) {
  if (props.kind === 'active') {
    return (
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        Active
      </span>
    )
  }
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
      Inactive
    </span>
  )
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-600"
        aria-hidden="true"
      >
        <path
          d="M7 7h10M7 12h10M7 17h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3 text-sm font-medium text-slate-200">No tasks yet</div>
      <div className="mt-1 text-sm text-slate-400">Create your first task to start tracking maintenance.</div>
    </div>
  )
}

export function TaskList(props: {
  items: TaskItem[]
  loading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onRefresh?: () => void
  onCompleteTask: (
    id: string,
    payload: { completedAt?: string; note?: string; cost?: number },
  ) => Promise<{ task: TaskItem; completion: CompletionItem }>
  onFetchCompletions: (taskId: string, limit?: number) => Promise<CompletionItem[]>
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [completionsByTaskId, setCompletionsByTaskId] = useState<Record<string, CompletionItem[] | undefined>>({})
  const [loadingCompletions, setLoadingCompletions] = useState<Record<string, boolean>>({})
  const [completionsError, setCompletionsError] = useState<Record<string, string | null | undefined>>({})

  const [modalTaskId, setModalTaskId] = useState<string | null>(null)
  const modalTask = useMemo(() => props.items.find((t) => t._id === modalTaskId) ?? null, [modalTaskId, props.items])
  const [completeDraft, setCompleteDraft] = useState<{ completedAtLocal: string; cost: string; note: string }>(() => ({
    completedAtLocal: nowLocalDateTimeValue(),
    cost: '',
    note: '',
  }))
  const [completeSubmitting, setCompleteSubmitting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  async function ensureCompletionsLoaded(taskId: string) {
    if (completionsByTaskId[taskId]) return
    if (loadingCompletions[taskId]) return
    setLoadingCompletions((m) => ({ ...m, [taskId]: true }))
    setCompletionsError((m) => ({ ...m, [taskId]: null }))
    try {
      const items = await props.onFetchCompletions(taskId, 20)
      setCompletionsByTaskId((m) => ({ ...m, [taskId]: items }))
    } catch (e) {
      setCompletionsError((m) => ({ ...m, [taskId]: e instanceof Error ? e.message : 'Failed to load history' }))
    } finally {
      setLoadingCompletions((m) => ({ ...m, [taskId]: false }))
    }
  }

  function openCompleteModal(taskId: string) {
    setCompleteError(null)
    setModalTaskId(taskId)
    setCompleteDraft({
      completedAtLocal: nowLocalDateTimeValue(),
      cost: '',
      note: '',
    })
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
      if (!Number.isNaN(d.getTime())) {
        completedAt = d.toISOString()
      }
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
      const result = await props.onCompleteTask(modalTaskId, { completedAt, note, cost })
      setCompletionsByTaskId((m) => {
        const existing = m[modalTaskId] ?? []
        return { ...m, [modalTaskId]: [result.completion, ...existing].slice(0, 20) }
      })
      setExpanded((m) => ({ ...m, [modalTaskId]: true }))
      closeCompleteModal()
      props.onRefresh?.()
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : 'Failed to complete task')
    } finally {
      setCompleteSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-100">Tasks</h2>
          <p className="mt-1 text-sm text-slate-400">Manage and update your maintenance tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          {props.loading ? <span className="text-sm text-slate-400">Loading…</span> : null}
          {props.onRefresh ? (
            <Button type="button" variant="ghost" onClick={props.onRefresh}>
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {!props.loading && props.items.length === 0 ? <EmptyState /> : null}

        <ul className="grid gap-4">
          {props.items.map((t) => {
            const status = computeStatus(t, 7)
            const isExpanded = Boolean(expanded[t._id])
            const history = completionsByTaskId[t._id]
            const historyLoading = Boolean(loadingCompletions[t._id])
            const historyError = completionsError[t._id]
            return (
              <li
                key={t._id}
                className={[
                  'rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20',
                  'transform-gpu transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-black/30',
                ].join(' ')}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-base font-medium text-slate-100">{t.title}</div>
                      <Badge kind={t.active ? 'active' : 'inactive'} />
                      <StatusBadge kind={status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span>{t.category ? t.category : '—'}</span>
                      <span className="text-slate-600">•</span>
                      <span>Next due: {formatDate(t.nextDueDate)}</span>
                      <span className="text-slate-600">•</span>
                      <span>{formatFrequency(t.frequencyUnit, t.frequencyInterval)}</span>
                    </div>
                    {t.description ? (
                      <div className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{t.description}</div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="primary" onClick={() => openCompleteModal(t._id)} disabled={!t.active}>
                      Complete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const next = !Boolean(expanded[t._id])
                        setExpanded((m) => ({ ...m, [t._id]: next }))
                        if (next) void ensureCompletionsLoaded(t._id)
                      }}
                    >
                      {isExpanded ? 'Hide history' : 'History'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => props.onEdit(t._id)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" onClick={() => props.onDelete(t._id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-200">Completion history</div>
                      {historyLoading ? <div className="text-sm text-slate-400">Loading…</div> : null}
                    </div>

                    {historyError ? (
                      <div role="alert" className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {historyError}
                      </div>
                    ) : null}

                    {!historyLoading && !historyError && (!history || history.length === 0) ? (
                      <div className="mt-3 text-sm text-slate-400">No completions yet.</div>
                    ) : null}

                    {!historyLoading && !historyError && history && history.length > 0 ? (
                      <ul className="mt-3 space-y-3">
                        {history.map((c) => (
                          <li key={c._id} className="rounded-xl border border-slate-800 bg-slate-950/20 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-sm font-medium text-slate-200">{formatDateTime(c.completedAt)}</div>
                              {typeof c.cost === 'number' ? (
                                <div className="text-sm text-slate-300">Cost: {formatNumber(c.cost)}</div>
                              ) : null}
                            </div>
                            {c.note ? <div className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{c.note}</div> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
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
    </Card>
  )
}

