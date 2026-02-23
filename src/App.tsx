import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth/AuthContext'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { AppLayout } from './layout/AppLayout'
import { CreateTaskPage } from './pages/tasks/CreateTaskPage'
import { EditTaskPage } from './pages/tasks/EditTaskPage'
import { TasksListPage } from './pages/tasks/TasksListPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { useSearchParams } from 'react-router-dom'

export default function App() {
  const { user, refresh } = useAuth()
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    // Try to restore session from refresh cookie on load.
    void refresh()
      .catch(() => null)
      .finally(() => setBootstrapped(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!bootstrapped) return null

  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksRoute />} />
        <Route path="/tasks/new" element={<CreateTaskPage />} />
        <Route path="/tasks/:id/edit" element={<EditTaskPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function TasksRoute() {
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view')
  if (view === 'dashboard') {
    const params = new URLSearchParams(searchParams)
    params.delete('view')
    const qs = params.toString()
    return <Navigate to={`/dashboard${qs ? `?${qs}` : ''}`} replace />
  }
  if (view === 'all') {
    const params = new URLSearchParams(searchParams)
    params.delete('view')
    const qs = params.toString()
    return <Navigate to={`/tasks${qs ? `?${qs}` : ''}`} replace />
  }
  return <TasksListPage />
}

function RequireAuth(props: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`
  if (!user) return <Navigate to="/login" replace state={{ from }} />
  return <>{props.children}</>
}

function LoginRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  if (user) return <Navigate to="/dashboard" replace />

  const from = location.state?.from
  return (
    <LoginPage
      onDone={() => {
        navigate(from ?? '/dashboard', { replace: true })
      }}
      onBack={() => {
        navigate('/', { replace: true })
      }}
    />
  )
}

function LandingRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <LandingPage
      onGetStarted={() => {
        navigate(user ? '/dashboard' : '/login')
      }}
    />
  )
}
