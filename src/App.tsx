import { Landing } from './pages/Landing'
import { Tasks } from './pages/Tasks'
import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Login } from './pages/Login'

export default function App() {
  const { user, refresh } = useAuth()
  const [view, setView] = useState<'landing' | 'login' | 'tasks'>('landing')

  useEffect(() => {
    // Try to restore session from refresh cookie on load.
    void refresh().catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    if (view === 'login' || view === 'tasks') {
      return <Login onDone={() => setView('tasks')} onBack={() => setView('landing')} />
    }
    return <Landing onGetStarted={() => setView('login')} />
  }

  if (view === 'tasks') return <Tasks onBack={() => setView('landing')} />

  return <Landing onGetStarted={() => setView('tasks')} />
}
