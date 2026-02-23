import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'

export type TaskItem = {
  _id: string
  title: string
  description?: string
  category?: string
  active: boolean
  frequencyUnit?: 'weekly' | 'monthly' | 'yearly'
  frequencyInterval?: number
  startDate?: string
  nextDueDate?: string
  lastCompletedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type TaskDraft = {
  title: string
  description: string
  category: string
  frequencyUnit: 'weekly' | 'monthly' | 'yearly'
  frequencyInterval: number
  startDate: string
  active?: boolean
}

type TasksResponse = { items: TaskItem[] }
type TaskResponse = { item: TaskItem }
type CategoriesResponse = { items: string[] }
export type CompletionItem = {
  _id: string
  taskId?: string
  completedAt: string
  note?: string
  cost?: number
  createdAt?: string
  updatedAt?: string
}

type CompletionsResponse = { items: CompletionItem[] }
type CompleteResponse = { task: TaskItem; completion: CompletionItem }

export type TasksQuery = {
  q?: string
  category?: string
  active?: 'true' | 'false'
  status?: 'overdue' | 'dueSoon' | 'upcoming'
  dueSoonDays?: number
}

export function useTasksData(options?: { loadTasks?: boolean }) {
  const { authFetch } = useAuth()
  const loadTasksOnMount = options?.loadTasks ?? true

  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(loadTasksOnMount)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const categoriesReady = !categoriesLoading && categories.length > 0

  const normalizeCategory = useCallback(
    (value: string) => {
      if (!categoriesReady) return value || 'Other'
      if (categories.includes(value)) return value
      if (categories.includes('Other')) return 'Other'
      return categories[0] ?? 'Other'
    },
    [categories, categoriesReady],
  )

  const loadTasks = useCallback(async (query?: TasksQuery) => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (query?.q) qs.set('q', query.q)
      if (query?.category) qs.set('category', query.category)
      if (query?.active) qs.set('active', query.active)
      if (query?.status) qs.set('status', query.status)
      if (typeof query?.dueSoonDays === 'number' && Number.isFinite(query.dueSoonDays)) {
        qs.set('dueSoonDays', String(Math.floor(query.dueSoonDays)))
      }

      const url = qs.size ? `/api/tasks?${qs.toString()}` : '/api/tasks'
      const res = await authFetch(url)
      const data = (await res.json()) as TasksResponse
      if (!res.ok) throw new Error('Failed to load tasks')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (!loadTasksOnMount) return
    void loadTasks()
  }, [loadTasks, loadTasksOnMount])

  useEffect(() => {
    let cancelled = false

    setCategoriesLoading(true)
    setCategoriesError(null)
    fetch('/api/task-categories')
      .then(async (res) => {
        const data = (await res.json()) as CategoriesResponse
        if (cancelled) return
        if (!res.ok) throw new Error('Failed to load categories')
        setCategories(Array.isArray(data.items) ? data.items : [])
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setCategoriesError(e instanceof Error ? e.message : 'Failed to load categories')
        setCategories([])
      })
      .finally(() => {
        if (cancelled) return
        setCategoriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      setError(null)
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || undefined,
          category: normalizeCategory(draft.category),
          frequencyUnit: draft.frequencyUnit,
          frequencyInterval: draft.frequencyInterval,
          startDate: draft.startDate,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to create task')
      }
      const data = (await res.json()) as TaskResponse
      return data.item
    },
    [authFetch, normalizeCategory],
  )

  const updateTask = useCallback(
    async (id: string, draft: TaskDraft) => {
      setError(null)
      const res = await authFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || '',
          category: normalizeCategory(draft.category),
          frequencyUnit: draft.frequencyUnit,
          frequencyInterval: draft.frequencyInterval,
          startDate: draft.startDate,
          active: draft.active,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to update task')
      }
      const data = (await res.json()) as TaskResponse
      return data.item
    },
    [authFetch, normalizeCategory],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      setError(null)
      const res = await authFetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to delete task')
      }
    },
    [authFetch],
  )

  const completeTask = useCallback(
    async (id: string, payload: { completedAt?: string; note?: string; cost?: number }) => {
      setError(null)
      const res = await authFetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to complete task')
      }
      const data = (await res.json()) as CompleteResponse
      return data
    },
    [authFetch],
  )

  const fetchCompletions = useCallback(
    async (taskId: string, limit = 20) => {
      setError(null)
      const res = await authFetch(`/api/tasks/${taskId}/completions?limit=${encodeURIComponent(String(limit))}`)
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to load completion history')
      }
      const data = (await res.json()) as CompletionsResponse
      return Array.isArray(data.items) ? data.items : []
    },
    [authFetch],
  )

  const value = useMemo(
    () => ({
      items,
      setItems,
      loading,
      error,
      setError,
      categories,
      categoriesReady,
      categoriesLoading,
      categoriesError,
      normalizeCategory,
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      completeTask,
      fetchCompletions,
    }),
    [
      items,
      loading,
      error,
      categories,
      categoriesReady,
      categoriesLoading,
      categoriesError,
      normalizeCategory,
      loadTasks,
      createTask,
      updateTask,
      deleteTask,
      completeTask,
      fetchCompletions,
    ],
  )

  return value
}

