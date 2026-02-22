import { Card } from '../../components/Card'

type Stat = {
  label: string
  value: number
  hint?: string
  accentClassName: string
}

export function StatsRow(props: { overdue: number; dueSoon: number; active: number }) {
  const stats: Stat[] = [
    {
      label: 'Overdue',
      value: props.overdue,
      hint: 'Requires attention',
      accentClassName: 'text-rose-300',
    },
    {
      label: 'Due Soon',
      value: props.dueSoon,
      hint: 'Coming up',
      accentClassName: 'text-amber-300',
    },
    {
      label: 'Active Tasks',
      value: props.active,
      hint: 'Currently tracked',
      accentClassName: 'text-emerald-300',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-400">{s.label}</div>
              <div className={`mt-2 text-3xl font-semibold tracking-tight ${s.accentClassName}`}>{s.value}</div>
              {s.hint ? <div className="mt-1 text-sm text-slate-400">{s.hint}</div> : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

