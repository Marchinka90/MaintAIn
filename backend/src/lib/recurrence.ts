export type FrequencyUnit = 'weekly' | 'monthly' | 'yearly'

const DAY_MS = 24 * 60 * 60 * 1000

function lastDayOfMonthUtc(year: number, monthIndex0: number) {
  // monthIndex0: 0-11
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}

function addMonthsUtc(date: Date, months: number) {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()

  const h = date.getUTCHours()
  const min = date.getUTCMinutes()
  const s = date.getUTCSeconds()
  const ms = date.getUTCMilliseconds()

  const totalMonths = m + months
  const targetYear = y + Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12

  const clampedDay = Math.min(d, lastDayOfMonthUtc(targetYear, targetMonth))
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay, h, min, s, ms))
}

export function addInterval(date: Date, unit: FrequencyUnit, interval: number) {
  if (!Number.isFinite(interval) || interval < 1) {
    throw new Error('interval must be >= 1')
  }

  if (unit === 'weekly') return new Date(date.getTime() + interval * 7 * DAY_MS)
  if (unit === 'monthly') return addMonthsUtc(date, interval)
  return addMonthsUtc(date, interval * 12)
}

export function calculateNextDueDate(completedAt: Date, unit: FrequencyUnit, interval: number) {
  return addInterval(completedAt, unit, interval)
}

