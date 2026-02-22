import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { TextField } from '../components/Field'
import { useAuth } from '../auth/AuthContext'

export function Login(props: { onDone: () => void; onBack?: () => void }) {
  const { login, register } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password)
      }
      props.onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          {props.onBack ? (
            <Button type="button" variant="ghost" onClick={props.onBack}>
              Back
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          <TextField
            label="Username"
            name="username"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            required
            placeholder="yourname"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            placeholder="••••••••"
          />

          {error ? (
            <div role="alert" className="rounded-xl border border-rose-300/35 bg-rose-300/10 px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap gap-2">
            <Button type="button" variant="primary" disabled={submitting} onClick={() => void submit()}>
              {submitting ? 'Working…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
            >
              {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
}

