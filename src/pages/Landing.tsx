import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

type HealthResponse = {
  ok: boolean
  db?: {
    connected?: boolean
  }
}

export function Landing(props: { onGetStarted?: () => void }) {
  const [apiStatus, setApiStatus] = useState<'checking' | 'up' | 'down'>('checking')

  useEffect(() => {
    let cancelled = false

    fetch('/api/health')
      .then(async (res) => {
        const data = (await res.json()) as HealthResponse
        if (cancelled) return
        setApiStatus(res.ok && data.ok ? 'up' : 'down')
      })
      .catch(() => {
        if (cancelled) return
        setApiStatus('down')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-8">
      <Card className="w-full max-w-3xl p-6 sm:p-10">
        <header className="grid gap-4">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.02] font-semibold">
            Maint
            <span className="bg-linear-to-br from-(--accent) to-(--accent2) bg-clip-text text-transparent">
              AI
            </span>
            n
          </h1>
          <p className="text-base sm:text-lg text-white/70">Smart Apartment Maintenance Tracker</p>
        </header>

        <div className="mt-5" aria-live="polite">
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
              'border-white/15 bg-white/5 text-white/80',
              apiStatus === 'up' ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-50' : '',
              apiStatus === 'down' ? 'border-rose-300/35 bg-rose-300/10 text-rose-50' : '',
            ].join(' ')}
          >
            <span className="font-medium">API</span>
            <span className="opacity-80">·</span>
            <span>
              {apiStatus === 'checking' ? 'Checking…' : apiStatus === 'up' ? 'Online' : 'Offline'}
            </span>
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={props.onGetStarted}>
            Get Started
          </Button>
          <a
            className="text-sm text-white/80 hover:text-white underline decoration-white/30 hover:decoration-white/50 underline-offset-4"
            href="https://github.com/Marchinka90/MaintAIn"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Repository
          </a>
        </div>
      </Card>
    </main>
  )
}
