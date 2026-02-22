import { Landing } from './pages/Landing'
import { Tasks } from './pages/Tasks'
import { useState } from 'react'

export default function App() {
  const [view, setView] = useState<'landing' | 'tasks'>('landing')

  if (view === 'tasks') {
    return <Tasks onBack={() => setView('landing')} />
  }

  return <Landing onGetStarted={() => setView('tasks')} />
}
