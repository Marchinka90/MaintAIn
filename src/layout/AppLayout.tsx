import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function inferTitle(pathname: string, view: string | null) {
  if (pathname === '/tasks/new') return 'New Task'
  if (pathname.startsWith('/tasks/') && pathname.endsWith('/edit')) return 'Edit Task'
  if (pathname === '/tasks') {
    if (view === 'all') return 'All Tasks'
    return 'Dashboard'
  }
  return 'Dashboard'
}

export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const view = searchParams.get('view')
  const title = inferTitle(location.pathname, view)

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

