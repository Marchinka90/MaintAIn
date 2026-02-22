import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAuth } from '../auth/AuthContext'

export function Landing(props: { onGetStarted?: () => void }) {
  const { user } = useAuth()

  const primaryCtaLabel = user ? 'Open Dashboard' : 'Sign in'

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_15%_20%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_35%,rgba(110,231,255,0.12),transparent_60%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/35" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <section className="space-y-7">
            <header className="space-y-4">
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-slate-100 sm:text-6xl">
                Maint<span className="text-indigo-400">AI</span>n
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                Track recurring apartment maintenance tasks in one place, so you always know what’s overdue, what’s next,
                and what’s already done.
              </p>
              <p className="max-w-xl text-sm text-slate-400">
                Create tasks, organize by category, and keep a reliable routine — without juggling notes and reminders.
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="primary" onClick={props.onGetStarted}>
                {primaryCtaLabel}
              </Button>
            </div>
          </section>

          <section className="lg:justify-self-end">
            <Card className="w-full max-w-xl p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-slate-100">Stay ahead of maintenance</h2>
                  <p className="mt-1 text-sm text-slate-400">A dashboard that keeps your home tasks on track.</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {[
                  'Track recurring tasks (monthly/quarterly/yearly)',
                  'See what’s overdue or due soon',
                  'Log completions and keep history',
                ].map((text) => (
                  <li key={text} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs text-indigo-300">
                      ✓
                    </span>
                    <span className="min-w-0">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Overdue', value: 2, accent: 'text-rose-300' },
                  { label: 'Due soon', value: 3, accent: 'text-amber-300' },
                  { label: 'Active', value: 8, accent: 'text-emerald-300' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-colors duration-200 hover:border-slate-700"
                  >
                    <div className="text-xs text-slate-400">{s.label}</div>
                    <div className={`mt-2 text-2xl font-semibold tracking-tight ${s.accent}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
