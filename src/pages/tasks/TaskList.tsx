import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import type { TaskItem } from './useTasksData'

function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatFrequency(unit?: TaskItem['frequencyUnit'], interval?: number) {
  const u = unit ?? 'monthly'
  const n = typeof interval === 'number' && Number.isFinite(interval) && interval >= 1 ? interval : 1
  const label = u === 'weekly' ? 'week' : u === 'yearly' ? 'year' : 'month'
  return n === 1 ? `Every ${label}` : `Every ${n} ${label}s`
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
}) {
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
                    <Button type="button" variant="ghost" onClick={() => props.onEdit(t._id)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" onClick={() => props.onDelete(t._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}

