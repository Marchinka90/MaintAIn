import { Button } from '../../components/Button'
import { StatsRow } from './StatsRow'

export function DashboardHeader(props: {
  title: string
  subtitle: string
  username?: string
  overdue: number
  dueSoon: number
  active: number
  onBack: () => void
  onLogout: () => void
}) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{props.title}</h1>
            {props.username ? (
              <span className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-300">
                {props.username}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-400">{props.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={props.onBack} aria-label="Go to home">
            Home
          </Button>
          <Button type="button" variant="ghost" onClick={props.onLogout} aria-label="Log out">
            Logout
          </Button>
        </div>
      </header>

      <StatsRow overdue={props.overdue} dueSoon={props.dueSoon} active={props.active} />
    </section>
  )
}

