import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TaskList } from './TaskList'
import { useTasksData, type TasksQuery } from './useTasksData'

function computeOverdueAndDueSoon(items: { active: boolean; nextDueDate?: string }[], dueSoonDays = 7) {
  const now = Date.now()
  const soon = now + dueSoonDays * 24 * 60 * 60 * 1000
  let overdue = 0
  let dueSoon = 0
  for (const t of items) {
    if (!t.active) continue
    if (!t.nextDueDate) continue
    const due = new Date(t.nextDueDate).getTime()
    if (Number.isNaN(due)) continue
    if (due < now) overdue++
    else if (due <= soon) dueSoon++
  }
  return { overdue, dueSoon }
}

export function TasksListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    items,
    loading,
    error,
    loadTasks,
    setError,
    deleteTask,
    completeTask,
    fetchCompletions,
    categories,
    categoriesReady,
  } = useTasksData({ loadTasks: false })

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items])
  const { overdue: overdueCount, dueSoon: dueSoonCount } = useMemo(() => computeOverdueAndDueSoon(items, 7), [items])

  const view = searchParams.get('view')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [active, setActive] = useState(searchParams.get('active') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')

  const qDebounceRef = useRef<number | null>(null)
  const suppressParamsLoadRef = useRef(false)

  useEffect(() => {
    if (!searchParams.get('view')) {
      const params = new URLSearchParams(searchParams)
      params.set('view', 'dashboard')
      setSearchParams(params, { replace: true })
      return
    }

    const nextQ = searchParams.get('q') ?? ''
    const nextCategory = searchParams.get('category') ?? ''
    const nextActive = searchParams.get('active') ?? ''
    const nextStatus = searchParams.get('status') ?? ''

    // If the URL changed due to in-page controls, avoid double-loading:
    // the handlers already triggered the network request (or will, for debounced search).
    if (suppressParamsLoadRef.current) {
      suppressParamsLoadRef.current = false
    } else {
      const changed = q !== nextQ || category !== nextCategory || active !== nextActive || status !== nextStatus
      if (changed) {
        const { query } = buildQuery({ q: nextQ, category: nextCategory, active: nextActive, status: nextStatus })
        void loadTasks(query)
      }
    }

    if (q !== nextQ) setQ(nextQ)
    if (category !== nextCategory) setCategory(nextCategory)
    if (active !== nextActive) setActive(nextActive)
    if (status !== nextStatus) setStatus(nextStatus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildQuery(next?: Partial<{ q: string; category: string; active: string; status: string }>): {
    query: TasksQuery
    params: URLSearchParams
  } {
    const merged = {
      q,
      category,
      active,
      status,
      ...next,
    }

    // Enforce backend rule: status applies to active tasks only
    let enforcedActive = merged.active
    let enforcedStatus = merged.status
    if (enforcedActive === 'false') enforcedStatus = ''
    if (enforcedStatus) enforcedActive = 'true'

    const params = new URLSearchParams()
    params.set('view', view ?? 'dashboard')
    if (merged.q.trim()) params.set('q', merged.q.trim())
    if (merged.category.trim()) params.set('category', merged.category.trim())
    if (enforcedActive === 'true' || enforcedActive === 'false') params.set('active', enforcedActive)
    if (enforcedStatus) params.set('status', enforcedStatus)

    const query: TasksQuery = {}
    if (merged.q.trim()) query.q = merged.q.trim()
    if (merged.category.trim()) query.category = merged.category.trim()
    if (enforcedActive === 'true' || enforcedActive === 'false') query.active = enforcedActive as 'true' | 'false'
    if (enforcedStatus) query.status = enforcedStatus as TasksQuery['status']

    return { query, params }
  }

  function applyImmediate(next?: Partial<{ q: string; category: string; active: string; status: string }>) {
    if (qDebounceRef.current) {
      window.clearTimeout(qDebounceRef.current)
      qDebounceRef.current = null
    }
    const { query, params } = buildQuery(next)
    suppressParamsLoadRef.current = true
    setSearchParams(params, { replace: true })
    void loadTasks(query)
  }

  function applyDebouncedQ(nextQ: string) {
    const { query, params } = buildQuery({ q: nextQ })
    suppressParamsLoadRef.current = true
    setSearchParams(params, { replace: true })
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current)
    qDebounceRef.current = window.setTimeout(() => {
      void loadTasks(query)
      qDebounceRef.current = null
    }, 350)
  }

  useEffect(() => {
    // initial load (or if navigated directly with params)
    const { query } = buildQuery()
    void loadTasks(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Overdue</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-rose-600">{overdueCount}</div>
          <div className="mt-1 text-sm text-slate-500">Needs attention</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Due Soon</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-amber-600">{dueSoonCount}</div>
          <div className="mt-1 text-sm text-slate-500">Next 7 days</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Active Tasks</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{activeCount}</div>
          <div className="mt-1 text-sm text-slate-500">{items.length} total</div>
        </Card>
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
          <div className="text-sm font-medium text-slate-700">Completed</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">0</div>
          <div className="mt-1 text-sm text-slate-500">This month (placeholder)</div>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{view === 'all' ? 'All Tasks' : 'Dashboard'} filters</div>
            <div className="mt-1 text-sm text-slate-600">Search and narrow down your tasks. Filters persist in the URL.</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              tone="light"
              onClick={() => {
                setQ('')
                setCategory('')
                setActive('')
                setStatus('')
                applyImmediate({ q: '', category: '', active: '', status: '' })
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="taskSearch" className="text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="taskSearch"
              name="taskSearch"
              type="text"
              value={q}
              onChange={(e) => {
                const next = e.target.value
                setQ(next)
                applyDebouncedQ(next)
              }}
              placeholder="Title or description…"
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200 placeholder:text-slate-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="categoryFilter" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="categoryFilter"
              name="categoryFilter"
              value={category}
              onChange={(e) => {
                const next = e.target.value
                setCategory(next)
                applyImmediate({ category: next })
              }}
              disabled={!categoriesReady}
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                !categoriesReady ? 'opacity-70' : '',
              ].join(' ')}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="activeFilter" className="text-sm font-medium text-slate-700">
              Active
            </label>
            <select
              id="activeFilter"
              name="activeFilter"
              value={active}
              onChange={(e) => {
                const next = e.target.value
                setActive(next)
                if (next === 'false') setStatus('')
                applyImmediate({ active: next, status: next === 'false' ? '' : status })
              }}
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="statusFilter"
              name="statusFilter"
              value={status}
              onChange={(e) => {
                const next = e.target.value
                setStatus(next)
                if (next) setActive('true')
                applyImmediate({ status: next, active: next ? 'true' : active })
              }}
              disabled={active === 'false'}
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                active === 'false' ? 'opacity-60' : '',
              ].join(' ')}
            >
              <option value="">All</option>
              <option value="overdue">Overdue</option>
              <option value="dueSoon">Due soon</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>
      </Card>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">{error}</div>
            <Button
              type="button"
              variant="ghost"
              tone="light"
              className="border-rose-200 text-rose-800 hover:bg-rose-100 focus-visible:ring-offset-rose-50"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <TaskList
        items={items}
        loading={loading}
        onNewTask={() => navigate('/tasks/new')}
        onRefresh={() => {
          const { query } = buildQuery()
          void loadTasks(query)
        }}
        onCompleteTask={completeTask}
        onFetchCompletions={fetchCompletions}
        onEdit={(id) => navigate(`/tasks/${id}/edit`)}
        onDelete={async (id) => {
          const task = items.find((t) => t._id === id)
          const ok = window.confirm(`Delete task “${task?.title ?? 'this task'}”?`)
          if (!ok) return
          try {
            const { query } = buildQuery()
            await deleteTask(id)
            await loadTasks(query)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete task')
          }
        }}
      />
    </div>
  )
}

