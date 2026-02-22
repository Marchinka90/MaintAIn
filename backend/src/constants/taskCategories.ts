export const TASK_CATEGORIES = [
  'Cleaning',
  'Appliances',
  'Bills',
  'Repairs',
  'Safety',
  'Other',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]

export function isValidTaskCategory(value: unknown): value is TaskCategory {
  return typeof value === 'string' && (TASK_CATEGORIES as readonly string[]).includes(value)
}

