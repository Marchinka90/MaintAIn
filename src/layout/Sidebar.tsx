import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const QUICK_CATEGORIES = ['Cleaning', 'Appliances', 'Bills', 'Repairs', 'Safety', 'Other'] as const

function navLinkClassName(isActive: boolean) {
  return [
    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-slate-800 text-white hover:bg-slate-700'
      : 'text-slate-200/80 hover:bg-slate-800/60 hover:text-slate-100',
  ].join(' ')
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCategory = new URLSearchParams(location.search).get('category')

  function setParam(next: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(location.search)
    for (const [k, v] of Object.entries(next)) {
      if (!v) params.delete(k)
      else params.set(k, v)
    }
    navigate({ pathname: '/tasks', search: params.toString() ? `?${params.toString()}` : '' })
  }

  return (
    <aside className="flex w-72 flex-col bg-slate-900 text-slate-100">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold tracking-tight">
          Maint<span className="text-indigo-300">AI</span>n
        </div>
        <div className="mt-1 text-sm text-slate-300/80">Personal maintenance tracker</div>
      </div>

      <nav className="px-4">
        <div className="space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" />
            All Tasks
          </NavLink>
          <NavLink to="/tasks?status=overdue" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
            Overdue
          </NavLink>
          <NavLink to="/tasks?status=dueSoon" className={({ isActive }) => navLinkClassName(isActive)}>
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            Due Soon
          </NavLink>
        </div>
      </nav>

      <div className="mt-5 border-t border-slate-800 px-4 py-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300/80">Quick filters</div>
        <div className="mt-3 space-y-2">
          {QUICK_CATEGORIES.map((c) => {
            const isSelected = selectedCategory === c
            return (
              <button
                key={c}
                type="button"
                aria-pressed={isSelected}
                className={[
                  'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                  isSelected
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/70 text-slate-100 hover:bg-slate-700 hover:text-white',
                ].join(' ')}
                onClick={() => setParam({ view: null, category: c })}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={['h-2 w-2 rounded-full', isSelected ? 'bg-indigo-300' : 'bg-slate-400'].join(' ')}
                    aria-hidden="true"
                  />
                  {c}
                </span>
                <span className={['text-slate-300/70', isSelected ? 'text-white/80' : ''].join(' ')} aria-hidden="true">
                  →
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

