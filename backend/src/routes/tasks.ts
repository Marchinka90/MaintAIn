import { Router } from 'express'
import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { Completion } from '../models/Completion.js'
import { TASK_CATEGORIES, isValidTaskCategory } from '../constants/taskCategories.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { addInterval } from '../lib/recurrence.js'

export const tasksRouter = Router()

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string'
}

function isOptionalNumber(v: unknown): v is number | undefined {
  return v === undefined || typeof v === 'number'
}

function isOptionalPositiveInt(v: unknown): v is number | undefined {
  return v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 1)
}

function parseOptionalDate(v: unknown) {
  if (v === undefined) return { ok: true as const, value: undefined as Date | undefined }
  if (typeof v !== 'string' && typeof v !== 'number') return { ok: false as const, error: 'must be a date string or number' }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return { ok: false as const, error: 'must be a valid date' }
  return { ok: true as const, value: d }
}

function parseId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  return new mongoose.Types.ObjectId(id)
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBoolQuery(v: unknown): boolean | undefined {
  if (v === 'true') return true
  if (v === 'false') return false
  return undefined
}

tasksRouter.use(requireAuth)

tasksRouter.get('/', async (req, res) => {
  const { active, isActive, category, status, dueSoonDays, q } = req.query

  const filter: Record<string, unknown> = {}
  filter.ownerUserId = req.user!.userId

  const activeFilter = parseBoolQuery(isActive) ?? parseBoolQuery(active)
  if (activeFilter !== undefined) filter.active = activeFilter

  if (typeof category === 'string' && category.trim()) filter.category = category.trim()

  const trimmedQ = typeof q === 'string' ? q.trim() : ''
  if (trimmedQ) {
    const rx = new RegExp(escapeRegExp(trimmedQ), 'i')
    filter.$or = [{ title: rx }, { description: rx }]
  }

  const now = new Date()
  const statusValue = typeof status === 'string' ? status : undefined
  if (statusValue) {
    const daysRaw = typeof dueSoonDays === 'string' ? Number(dueSoonDays) : undefined
    const days = Number.isFinite(daysRaw) && daysRaw ? Math.min(Math.max(Math.floor(daysRaw), 1), 365) : 7

    if (activeFilter === false) {
      return res.status(400).json({ error: 'status filter applies to active tasks only' })
    }
    filter.active = true

    const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    if (statusValue === 'overdue') {
      filter.nextDueDate = { $lt: now }
    } else if (statusValue === 'dueSoon') {
      filter.nextDueDate = { $gte: now, $lte: soon }
    } else if (statusValue === 'upcoming') {
      filter.nextDueDate = { $gt: soon }
    } else {
      return res.status(400).json({ error: 'status must be overdue|dueSoon|upcoming' })
    }
  }

  const tasks = await Task.find(filter).sort({ nextDueDate: 1, updatedAt: -1 }).lean()
  res.json({ items: tasks })
})

tasksRouter.post('/', async (req, res) => {
  const body = req.body as Record<string, unknown>

  if (!isNonEmptyString(body.title)) {
    return res.status(400).json({ error: 'title is required' })
  }

  if (!isOptionalString(body.description)) return res.status(400).json({ error: 'description must be a string' })
  if (!isNonEmptyString(body.category)) {
    return res.status(400).json({ error: `category is required (one of: ${TASK_CATEGORIES.join(', ')})` })
  }
  if (!isValidTaskCategory(body.category)) {
    return res.status(400).json({ error: `category must be one of: ${TASK_CATEGORIES.join(', ')}` })
  }

  const frequencyUnit = body.frequencyUnit
  if (
    frequencyUnit !== undefined &&
    frequencyUnit !== 'weekly' &&
    frequencyUnit !== 'monthly' &&
    frequencyUnit !== 'yearly'
  ) {
    return res.status(400).json({ error: 'frequencyUnit must be weekly|monthly|yearly' })
  }

  if (!isOptionalPositiveInt(body.frequencyInterval)) {
    return res.status(400).json({ error: 'frequencyInterval must be a positive integer' })
  }

  const startDateParsed = parseOptionalDate(body.startDate)
  if (!startDateParsed.ok) {
    return res.status(400).json({ error: `startDate ${startDateParsed.error}` })
  }

  const active = body.active
  if (active !== undefined && typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be boolean' })
  }

  const unit = (frequencyUnit ?? 'monthly') as 'weekly' | 'monthly' | 'yearly'
  const interval = (body.frequencyInterval ?? 1) as number
  const startDate = startDateParsed.value ?? new Date()
  const nextDueDate = addInterval(startDate, unit, interval)

  const task = await Task.create({
    ownerUserId: req.user!.userId,
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description : undefined,
    category: body.category,
    frequencyUnit: unit,
    frequencyInterval: interval,
    startDate,
    nextDueDate,
    active: typeof active === 'boolean' ? active : undefined,
  })

  res.status(201).json({ item: task.toObject() })
})

tasksRouter.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const task = await Task.findOne({ _id: id, ownerUserId: req.user!.userId }).lean()
  if (!task) return res.status(404).json({ error: 'not found' })

  res.json({ item: task })
})

tasksRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const body = req.body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  let shouldRecomputeNextDueDate = false

  if (body.title !== undefined) {
    if (!isNonEmptyString(body.title)) return res.status(400).json({ error: 'title must be non-empty string' })
    update.title = body.title.trim()
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return res.status(400).json({ error: 'description must be string' })
    update.description = body.description
  }

  if (body.category !== undefined) {
    if (!isNonEmptyString(body.category)) {
      return res.status(400).json({ error: `category is required (one of: ${TASK_CATEGORIES.join(', ')})` })
    }
    if (!isValidTaskCategory(body.category)) {
      return res.status(400).json({ error: `category must be one of: ${TASK_CATEGORIES.join(', ')}` })
    }
    update.category = body.category
  }

  if (body.frequencyUnit !== undefined) {
    const unit = body.frequencyUnit
    if (unit !== 'weekly' && unit !== 'monthly' && unit !== 'yearly') {
      return res.status(400).json({ error: 'frequencyUnit must be weekly|monthly|yearly' })
    }
    update.frequencyUnit = unit
    shouldRecomputeNextDueDate = true
  }

  if (body.frequencyInterval !== undefined) {
    if (!isOptionalPositiveInt(body.frequencyInterval)) {
      return res.status(400).json({ error: 'frequencyInterval must be a positive integer' })
    }
    update.frequencyInterval = body.frequencyInterval
    shouldRecomputeNextDueDate = true
  }

  if (body.startDate !== undefined) {
    const parsed = parseOptionalDate(body.startDate)
    if (!parsed.ok || !parsed.value) return res.status(400).json({ error: `startDate ${parsed.ok ? 'must be a valid date' : parsed.error}` })
    update.startDate = parsed.value
    shouldRecomputeNextDueDate = true
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return res.status(400).json({ error: 'active must be boolean' })
    update.active = body.active
  }

  if (body.nextDueDate !== undefined) {
    return res.status(400).json({ error: 'nextDueDate is computed and cannot be set directly' })
  }

  if (shouldRecomputeNextDueDate) {
    const existing = await Task.findOne({ _id: id, ownerUserId: req.user!.userId }).lean()
    if (!existing) return res.status(404).json({ error: 'not found' })

    const unit = (update.frequencyUnit ?? existing.frequencyUnit ?? 'monthly') as 'weekly' | 'monthly' | 'yearly'
    const interval = (update.frequencyInterval ?? existing.frequencyInterval ?? 1) as number
    const startDate = (update.startDate ?? existing.startDate ?? existing.createdAt ?? new Date()) as Date
    const base = (existing.lastCompletedAt ?? startDate) as Date
    update.nextDueDate = addInterval(base, unit, interval)
  }

  const task = await Task.findOneAndUpdate({ _id: id, ownerUserId: req.user!.userId }, update, {
    new: true,
    runValidators: true,
  }).lean()
  if (!task) return res.status(404).json({ error: 'not found' })

  res.json({ item: task })
})

tasksRouter.post('/:id/complete', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const body = req.body as Record<string, unknown>

  const completedAtParsed = parseOptionalDate(body.completedAt)
  if (!completedAtParsed.ok) return res.status(400).json({ error: `completedAt ${completedAtParsed.error}` })
  const completedAt = completedAtParsed.value ?? new Date()

  if (!isOptionalString(body.note)) return res.status(400).json({ error: 'note must be a string' })

  if (!isOptionalNumber(body.cost)) return res.status(400).json({ error: 'cost must be a number' })
  if (typeof body.cost === 'number' && body.cost < 0) return res.status(400).json({ error: 'cost must be >= 0' })

  const task = await Task.findOne({ _id: id, ownerUserId: req.user!.userId })
  if (!task) return res.status(404).json({ error: 'not found' })

  const completion = await Completion.create({
    taskId: task._id,
    completedAt,
    note: typeof body.note === 'string' ? body.note : undefined,
    cost: typeof body.cost === 'number' ? body.cost : undefined,
  })

  const nextDueDate = addInterval(completedAt, task.frequencyUnit, task.frequencyInterval)
  task.lastCompletedAt = completedAt
  task.nextDueDate = nextDueDate
  await task.save()

  res.json({ task: task.toObject(), completion: completion.toObject() })
})

tasksRouter.get('/:id/completions', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
  const limit =
    typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 20

  const taskExists = await Task.exists({ _id: id, ownerUserId: req.user!.userId })
  if (!taskExists) return res.status(404).json({ error: 'not found' })

  const completions = await Completion.find({ taskId: id }).sort({ completedAt: -1, createdAt: -1 }).limit(limit).lean()
  res.json({ items: completions })
})

tasksRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const deleted = await Task.findOneAndDelete({ _id: id, ownerUserId: req.user!.userId }).lean()
  if (!deleted) return res.status(404).json({ error: 'not found' })

  res.json({ ok: true })
})

