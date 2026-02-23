import { Button } from '../components/Button'
import { useAuth } from '../auth/AuthContext'

export function Topbar(props: { title: string; onLogout: () => void }) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{props.title}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="truncate">{user?.username ?? 'User'}</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          tone="light"
          className="active:translate-y-px hover:shadow-sm hover:shadow-black/10"
          onClick={props.onLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  )
}

