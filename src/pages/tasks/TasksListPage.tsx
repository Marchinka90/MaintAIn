import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { DashboardHeader } from './DashboardHeader'
import { TaskList } from './TaskList'
import { useTasksData } from './useTasksData'

export function TasksListPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { items, loading, error, loadTasks, setError, deleteTask, completeTask, fetchCompletions } = useTasksData({ loadTasks: true })

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items])
  const overdueCount = 0
  const dueSoonCount = 0

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader
          title="Tasks"
          subtitle={`${items.length} total · ${activeCount} active`}
          username={user?.username}
          overdue={overdueCount}
          dueSoon={dueSoonCount}
          active={activeCount}
          onBack={() => navigate('/')}
          onLogout={() => void logout().then(() => navigate('/'))}
        />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="primary" onClick={() => navigate('/tasks/new')}>
            New Task
          </Button>
        </div>

        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">{error}</div>
              <Button type="button" variant="ghost" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        <TaskList
          items={items}
          loading={loading}
          onRefresh={() => void loadTasks()}
          onCompleteTask={completeTask}
          onFetchCompletions={fetchCompletions}
          onEdit={(id) => navigate(`/tasks/${id}/edit`)}
          onDelete={async (id) => {
            const task = items.find((t) => t._id === id)
            const ok = window.confirm(`Delete task “${task?.title ?? 'this task'}”?`)
            if (!ok) return
            try {
              await deleteTask(id)
              await loadTasks()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to delete task')
            }
          }}
        />
      </div>
    </main>
  )
}

