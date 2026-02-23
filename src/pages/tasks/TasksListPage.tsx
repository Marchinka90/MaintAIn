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

type StatusUi = '' | 'overdue' | 'dueSoon' | 'upcoming' | 'inactive'

function statusUiFromParams(params: URLSearchParams): StatusUi {
  const active = params.get('active')
  const status = params.get('status')
  if (active === 'false') return 'inactive'
  if (status === 'overdue' || status === 'dueSoon' || status === 'upcoming') return status
  return ''
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

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [statusUi, setStatusUi] = useState<StatusUi>(() => statusUiFromParams(searchParams))

  const qDebounceRef = useRef<number | null>(null)
  const suppressParamsLoadRef = useRef(false)

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? ''
    const nextCategory = searchParams.get('category') ?? ''
    const nextStatusUi = statusUiFromParams(searchParams)

    // If the URL changed due to in-page controls, avoid double-loading:
    // the handlers already triggered the network request (or will, for debounced search).
    if (suppressParamsLoadRef.current) {
      suppressParamsLoadRef.current = false
    } else {
      const changed = q !== nextQ || category !== nextCategory || statusUi !== nextStatusUi
      if (changed) {
        const { query } = buildQuery({ q: nextQ, category: nextCategory, statusUi: nextStatusUi })
        void loadTasks(query)
      }
    }

    if (q !== nextQ) setQ(nextQ)
    if (category !== nextCategory) setCategory(nextCategory)
    if (statusUi !== nextStatusUi) setStatusUi(nextStatusUi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildQuery(next?: Partial<{ q: string; category: string; statusUi: StatusUi }>): {
    query: TasksQuery
    params: URLSearchParams
  } {
    const merged = {
      q,
      category,
      statusUi,
      ...next,
    }

    const params = new URLSearchParams()
    if (merged.q.trim()) params.set('q', merged.q.trim())
    if (merged.category.trim()) params.set('category', merged.category.trim())
    if (merged.statusUi === 'inactive') params.set('active', 'false')
    else if (merged.statusUi) params.set('status', merged.statusUi)

    const query: TasksQuery = {}
    if (merged.q.trim()) query.q = merged.q.trim()
    if (merged.category.trim()) query.category = merged.category.trim()
    if (merged.statusUi === 'inactive') query.active = 'false'
    else if (merged.statusUi) {
      query.status = merged.statusUi as TasksQuery['status']
      // backend status filters are defined for active tasks; keep URL clean but send active=true for safety
      query.active = 'true'
    }

    return { query, params }
  }

  function applyImmediate(next?: Partial<{ q: string; category: string; statusUi: StatusUi }>) {
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
      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Filters</div>
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
                setStatusUi('')
                applyImmediate({ q: '', category: '', statusUi: '' })
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <label htmlFor="statusFilter" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="statusFilter"
              name="statusFilter"
              value={statusUi}
              onChange={(e) => {
                const next = e.target.value as StatusUi
                setStatusUi(next)
                applyImmediate({ statusUi: next })
              }}
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            >
              <option value="">All</option>
              <option value="overdue">Overdue</option>
              <option value="dueSoon">Due soon</option>
              <option value="upcoming">Upcoming</option>
              <option value="inactive">Inactive</option>
            </select>
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

