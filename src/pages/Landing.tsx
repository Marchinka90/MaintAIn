import { useEffect, useState } from 'react'
import './landing.css'

type HealthResponse = {
  ok: boolean
  db?: {
    connected?: boolean
  }
}

export function Landing() {
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
    <main className="landing">
      <section className="landingCard">
        <header className="landingHeader">
          <h1 className="brand">
            Maint<span className="brandAccent">AIn</span>
          </h1>
          <p className="tagline">Smart Apartment Maintenance Tracker</p>
        </header>

        <div className="statusRow" aria-live="polite">
          <span className={`statusPill status-${apiStatus}`}>
            API:{' '}
            {apiStatus === 'checking' ? 'Checking…' : apiStatus === 'up' ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="actions">
          <button type="button" className="primaryBtn">
            Get started
          </button>
          <a
            className="secondaryLink"
            href="https://github.com/Marchinka90/MaintAIn"
            target="_blank"
            rel="noreferrer"
          >
            View repository
          </a>
        </div>
      </section>
    </main>
  )
}
