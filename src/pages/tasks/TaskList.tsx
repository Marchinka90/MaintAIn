import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import type { TaskItem } from './useTasksData'

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
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-100">Tasks</h2>
          <p className="mt-1 text-sm text-slate-400">Manage and update your maintenance tasks.</p>
        </div>
        {props.loading ? <span className="text-sm text-slate-400">Loading…</span> : null}
      </div>

      <div className="mt-6 space-y-4">
        {!props.loading && props.items.length === 0 ? <EmptyState /> : null}

        <ul className="grid gap-4">
          {props.items.map((t) => {
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
                    </div>
                    <div className="mt-2 text-sm text-slate-400">{t.category ? t.category : '—'}</div>
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

