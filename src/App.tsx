import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth/AuthContext'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { CreateTaskPage } from './pages/tasks/CreateTaskPage'
import { EditTaskPage } from './pages/tasks/EditTaskPage'
import { TasksListPage } from './pages/tasks/TasksListPage'

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
        path="/tasks"
        element={
          <RequireAuth>
            <TasksListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <RequireAuth>
            <CreateTaskPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tasks/:id/edit"
        element={
          <RequireAuth>
            <EditTaskPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
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
  if (user) return <Navigate to="/tasks" replace />

  const from = location.state?.from
  return (
    <Login
      onDone={() => {
        navigate(from ?? '/tasks', { replace: true })
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
    <Landing
      onGetStarted={() => {
        navigate(user ? '/tasks' : '/login')
      }}
    />
  )
}
