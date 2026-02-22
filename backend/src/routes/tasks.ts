import { Router } from 'express'
import mongoose from 'mongoose'
import { Task } from '../models/Task.js'

export const tasksRouter = Router()

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string'
}

function isOptionalPositiveInt(v: unknown): v is number | undefined {
  return v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 1)
}

function parseId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  return new mongoose.Types.ObjectId(id)
}

tasksRouter.get('/', async (req, res) => {
  const { active, category } = req.query

  const filter: Record<string, unknown> = {}
  if (active === 'true') filter.active = true
  if (active === 'false') filter.active = false
  if (typeof category === 'string' && category.trim()) filter.category = category.trim()

  const tasks = await Task.find(filter).sort({ updatedAt: -1 }).lean()
  res.json({ items: tasks })
})

tasksRouter.post('/', async (req, res) => {
  const body = req.body as Record<string, unknown>

  if (!isNonEmptyString(body.title)) {
    return res.status(400).json({ error: 'title is required' })
  }

  if (!isOptionalString(body.description)) return res.status(400).json({ error: 'description must be a string' })
  if (!isOptionalString(body.category)) return res.status(400).json({ error: 'category must be a string' })

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

  const active = body.active
  if (active !== undefined && typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be boolean' })
  }

  const task = await Task.create({
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    frequencyUnit: frequencyUnit as 'weekly' | 'monthly' | 'yearly' | undefined,
    frequencyInterval: body.frequencyInterval as number | undefined,
    active: typeof active === 'boolean' ? active : undefined,
  })

  res.status(201).json({ item: task.toObject() })
})

tasksRouter.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const task = await Task.findById(id).lean()
  if (!task) return res.status(404).json({ error: 'not found' })

  res.json({ item: task })
})

tasksRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const body = req.body as Record<string, unknown>
  const update: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (!isNonEmptyString(body.title)) return res.status(400).json({ error: 'title must be non-empty string' })
    update.title = body.title.trim()
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return res.status(400).json({ error: 'description must be string' })
    update.description = body.description
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string') return res.status(400).json({ error: 'category must be string' })
    update.category = body.category
  }

  if (body.frequencyUnit !== undefined) {
    const unit = body.frequencyUnit
    if (unit !== 'weekly' && unit !== 'monthly' && unit !== 'yearly') {
      return res.status(400).json({ error: 'frequencyUnit must be weekly|monthly|yearly' })
    }
    update.frequencyUnit = unit
  }

  if (body.frequencyInterval !== undefined) {
    if (!isOptionalPositiveInt(body.frequencyInterval)) {
      return res.status(400).json({ error: 'frequencyInterval must be a positive integer' })
    }
    update.frequencyInterval = body.frequencyInterval
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return res.status(400).json({ error: 'active must be boolean' })
    update.active = body.active
  }

  const task = await Task.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean()
  if (!task) return res.status(404).json({ error: 'not found' })

  res.json({ item: task })
})

tasksRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })

  const deleted = await Task.findByIdAndDelete(id).lean()
  if (!deleted) return res.status(404).json({ error: 'not found' })

  res.json({ ok: true })
})

