import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function inferTitle(pathname: string, status: string | null, active: string | null) {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/tasks/new') return 'New Task'
  if (pathname.startsWith('/tasks/') && pathname.endsWith('/edit')) return 'Edit Task'
  if (pathname === '/tasks') {
    if (active === 'false') return 'Inactive Tasks'
    if (status === 'overdue') return 'Overdue Tasks'
    if (status === 'dueSoon') return 'Due Soon'
    if (status === 'upcoming') return 'Upcoming'
    return 'All Tasks'
  }
  return 'Dashboard'
}

export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status')
  const active = searchParams.get('active')
  const title = inferTitle(location.pathname, status, active)

  return (
    <div className="min-h-screen bg-slate-100" style={{ colorScheme: 'light' }}>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-8">
            <div className="mx-auto w-full max-w-6xl space-y-8">
              <Topbar
                title={title}
                onLogout={() => {
                  void logout().then(() => navigate('/'))
                }}
              />

              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

