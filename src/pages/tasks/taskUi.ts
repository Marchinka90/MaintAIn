import type { TaskItem } from './useTasksData'

const DAY_MS = 24 * 60 * 60 * 1000

export function formatDate(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export function formatDateTime(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

export function nowLocalDateTimeValue() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function formatFrequency(unit?: TaskItem['frequencyUnit'], interval?: number) {
  const u = unit ?? 'monthly'
  const n = typeof interval === 'number' && Number.isFinite(interval) && interval >= 1 ? interval : 1
  const label = u === 'weekly' ? 'week' : u === 'yearly' ? 'year' : 'month'
  return n === 1 ? `Every ${label}` : `Every ${n} ${label}s`
}

export type DueDelta = { kind: 'missing' | 'overdue' | 'dueSoon' | 'upcoming'; days: number }

export function computeDueDelta(nextDueDate?: string, dueSoonDays = 7): DueDelta {
  if (!nextDueDate) return { kind: 'missing', days: 0 }
  const due = new Date(nextDueDate).getTime()
  if (Number.isNaN(due)) return { kind: 'missing', days: 0 }

  const now = Date.now()
  if (due < now) {
    const days = Math.max(1, Math.ceil((now - due) / DAY_MS))
    return { kind: 'overdue', days }
  }

  const days = Math.max(0, Math.ceil((due - now) / DAY_MS))
  if (days <= dueSoonDays) return { kind: 'dueSoon', days }
  return { kind: 'upcoming', days }
}

