import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CompleteTaskModal } from './CompleteTaskModal'
import { TaskCard } from './TaskCard'
import type { CompletionItem, TaskItem } from './useTasksData'
import { nowLocalDateTimeValue } from './taskUi'

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm shadow-black/5">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-400"
        aria-hidden="true"
      >
        <path
          d="M7 7h10M7 12h10M7 17h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3 text-sm font-semibold text-slate-900">No tasks yet</div>
      <div className="mt-1 text-sm text-slate-600">Create your first task to start tracking maintenance.</div>
    </div>
  )
}

export function TaskList(props: {
  items: TaskItem[]
  loading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onRefresh?: () => void
  onNewTask?: () => void
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
    <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
          <p className="mt-1 text-sm text-slate-600">Manage and update your maintenance tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          {props.loading ? <span className="text-sm text-slate-600">Loading…</span> : null}
          {props.onNewTask ? (
            <Button type="button" variant="primary" tone="light" onClick={props.onNewTask}>
              New Task
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {!props.loading && props.items.length === 0 ? <EmptyState /> : null}

        <ul className="grid gap-4">
          {props.items.map((t) => {
            const isExpanded = Boolean(expanded[t._id])
            const history = completionsByTaskId[t._id]
            const historyLoading = Boolean(loadingCompletions[t._id])
            const historyError = completionsError[t._id]
            return (
              <li key={t._id}>
                <TaskCard
                  task={t}
                  historyOpen={isExpanded}
                  history={history}
                  historyLoading={historyLoading}
                  historyError={historyError}
                  onComplete={() => openCompleteModal(t._id)}
                  onEdit={() => props.onEdit(t._id)}
                  onDelete={() => void props.onDelete(t._id)}
                  onToggleHistory={() => {
                    const next = !Boolean(expanded[t._id])
                    setExpanded((m) => ({ ...m, [t._id]: next }))
                    if (next) void ensureCompletionsLoaded(t._id)
                  }}
                />
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

