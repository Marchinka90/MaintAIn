import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

export function LoginPage(props: { onDone: () => void; onBack: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => username.trim().length >= 3 && password.length >= 6, [username, password])

  async function onSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password)
      props.onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to authenticate')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_20%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_600px_at_80%_35%,rgba(110,231,255,0.12),transparent_60%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/40" />

      <div className="relative w-full max-w-md">
        <Card className="p-6 sm:p-7">
          <div className="space-y-1">
            <div className="text-xl font-semibold tracking-tight text-slate-100">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
            <div className="text-sm text-slate-400">
              {mode === 'login' ? 'Sign in to access your dashboard.' : 'Create an account to start tracking tasks.'}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="mmarc"
                className={[
                  'w-full rounded-xl border bg-slate-900/60 px-3 py-2 text-sm text-slate-100',
                  'border-slate-800 placeholder:text-slate-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                ].join(' ')}
              />
              <div className="text-xs text-slate-500">At least 3 characters.</div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className={[
                  'w-full rounded-xl border bg-slate-900/60 px-3 py-2 text-sm text-slate-100',
                  'border-slate-800 placeholder:text-slate-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                ].join(' ')}
              />
              <div className="text-xs text-slate-500">At least 6 characters.</div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={props.onBack} disabled={submitting}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode((m) => (m === 'login' ? 'register' : 'login'))
                    setError(null)
                  }}
                  disabled={submitting}
                >
                  {mode === 'login' ? 'Create account' : 'I have an account'}
                </Button>
                <Button type="button" variant="primary" onClick={() => void onSubmit()} disabled={!canSubmit || submitting}>
                  {submitting ? (mode === 'login' ? 'Signing in…' : 'Creating…') : mode === 'login' ? 'Sign in' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

