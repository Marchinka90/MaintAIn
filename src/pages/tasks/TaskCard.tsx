import { Button } from '../../components/Button'
import type { CompletionItem, TaskItem } from './useTasksData'
import { computeDueDelta, formatDate, formatDateTime, formatFrequency, formatNumber, type DueDelta } from './taskUi'

type BadgeProps = { tone: 'slate' | 'emerald' | 'rose' | 'amber' | 'sky'; children: string }

function Badge(props: BadgeProps) {
  const tones: Record<BadgeProps['tone'], string> = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[props.tone]}`}>{props.children}</span>
}

function dueLabel(task: TaskItem, due: DueDelta) {
  if (!task.active) return 'Inactive tasks do not have a status.'
  if (due.kind === 'missing') return 'Next due date is not set.'
  if (due.kind === 'overdue') return `Overdue by ${due.days} day${due.days === 1 ? '' : 's'}`
  if (due.kind === 'dueSoon') return due.days === 0 ? 'Due today' : `Due in ${due.days} day${due.days === 1 ? '' : 's'}`
  return `Next due in ${due.days} day${due.days === 1 ? '' : 's'}`
}

function dueBadgeTone(task: TaskItem, due: DueDelta): BadgeProps['tone'] {
  if (!task.active) return 'slate'
  if (due.kind === 'overdue') return 'rose'
  if (due.kind === 'dueSoon') return 'amber'
  return 'sky'
}

function dueBadgeLabel(task: TaskItem, due: DueDelta) {
  if (!task.active) return 'Inactive'
  if (due.kind === 'overdue') return 'Overdue'
  if (due.kind === 'dueSoon') return 'Due soon'
  return 'Upcoming'
}

export function TaskCard(props: {
  task: TaskItem
  dueSoonDays?: number
  historyOpen: boolean
  historyLoading: boolean
  historyError?: string | null
  history?: CompletionItem[]
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleHistory: () => void
}) {
  const due = computeDueDelta(props.task.nextDueDate, props.dueSoonDays ?? 7)
  const frequency = formatFrequency(props.task.frequencyUnit, props.task.frequencyInterval)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-black/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-900">{props.task.title}</div>
            <Badge tone={props.task.active ? 'emerald' : 'slate'}>{props.task.active ? 'Active' : 'Inactive'}</Badge>
            <Badge tone={dueBadgeTone(props.task, due)}>{dueBadgeLabel(props.task, due)}</Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {props.task.category ? props.task.category : '—'}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {frequency}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700">Next due: {formatDate(props.task.nextDueDate)}</span>
          </div>

          <div className="mt-2 text-sm font-medium text-slate-700">{dueLabel(props.task, due)}</div>

          {props.task.description ? (
            <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{props.task.description}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="primary"
            tone="light"
            onClick={props.onComplete}
            disabled={!props.task.active}
          >
            Complete
          </Button>
          <Button
            type="button"
            variant="ghost"
            tone="light"
            onClick={props.onToggleHistory}
          >
            {props.historyOpen ? 'Hide history' : 'History'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            tone="light"
            onClick={props.onEdit}
          >
            Edit
          </Button>
          <Button type="button" variant="danger" tone="light" onClick={props.onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {props.historyOpen ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Completion history</div>
            {props.historyLoading ? <div className="text-sm text-slate-600">Loading…</div> : null}
          </div>

          {props.historyError ? (
            <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {props.historyError}
            </div>
          ) : null}

          {!props.historyLoading && !props.historyError && (!props.history || props.history.length === 0) ? (
            <div className="mt-3 text-sm text-slate-600">No completions yet.</div>
          ) : null}

          {!props.historyLoading && !props.historyError && props.history && props.history.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {props.history.map((c) => (
                <li key={c._id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">{formatDateTime(c.completedAt)}</div>
                    {typeof c.cost === 'number' ? (
                      <div className="text-sm text-slate-700">Cost: {formatNumber(c.cost)}</div>
                    ) : null}
                  </div>
                  {c.note ? <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{c.note}</div> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

