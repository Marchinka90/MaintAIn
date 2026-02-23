import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextareaField, TextField } from '../../components/Field'

export type TaskDraft = {
  title: string
  description: string
  category: string
  frequencyUnit: 'weekly' | 'monthly' | 'yearly'
  frequencyInterval: number
  startDate: string
}

export function CreateTaskCard(props: {
  draft: TaskDraft
  onDraftChange: (next: TaskDraft) => void
  onSubmit: () => void
  onClear: () => void
  submitting: boolean
  titleError: string | null
  intervalError: string | null
  startDateError: string | null
  categories: string[]
  categoriesReady: boolean
  categoriesError: string | null
  normalizeCategory: (value: string) => string
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-100">Create Task</h2>
          <p className="mt-1 text-sm text-slate-400">Add a recurring responsibility to your list.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <TextField
          label="Title"
          name="title"
          value={props.draft.title}
          onChange={(value) => props.onDraftChange({ ...props.draft, title: value })}
          placeholder="Replace HVAC filter"
          autoComplete="off"
          required
          error={props.titleError}
        />

        <TextareaField
          label="Description"
          name="description"
          value={props.draft.description}
          onChange={(value) => props.onDraftChange({ ...props.draft, description: value })}
          placeholder="Notes, steps, parts to buy…"
          autoComplete="off"
        />

        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm text-slate-400">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={props.normalizeCategory(props.draft.category)}
              onChange={(e) => props.onDraftChange({ ...props.draft, category: e.target.value })}
              disabled={!props.categoriesReady}
              required
              className={[
                'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                'border-slate-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              ].join(' ')}
            >
              {props.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {props.categoriesError ? (
              <p className="text-sm text-rose-300" role="alert">
                {props.categoriesError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="startDate" className="text-sm text-slate-400">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={props.draft.startDate}
              onChange={(e) => props.onDraftChange({ ...props.draft, startDate: e.target.value })}
              required
              className={[
                'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                'border-slate-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                props.startDateError ? 'border-rose-500/40' : '',
              ].join(' ')}
            />
            {props.startDateError ? (
              <p className="text-sm text-rose-300" role="alert">
                {props.startDateError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <label htmlFor="frequencyUnit" className="text-sm text-slate-400">
              Frequency
            </label>
            <select
              id="frequencyUnit"
              name="frequencyUnit"
              value={props.draft.frequencyUnit}
              onChange={(e) =>
                props.onDraftChange({ ...props.draft, frequencyUnit: e.target.value as TaskDraft['frequencyUnit'] })
              }
              required
              className={[
                'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                'border-slate-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              ].join(' ')}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="frequencyInterval" className="text-sm text-slate-400">
              Interval
            </label>
            <input
              id="frequencyInterval"
              name="frequencyInterval"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={String(props.draft.frequencyInterval)}
              onChange={(e) =>
                props.onDraftChange({
                  ...props.draft,
                  frequencyInterval: e.target.value === '' ? 1 : Number(e.target.value),
                })
              }
              required
              className={[
                'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
                'border-slate-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                props.intervalError ? 'border-rose-500/40' : '',
              ].join(' ')}
            />
            {props.intervalError ? (
              <p className="text-sm text-rose-300" role="alert">
                {props.intervalError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            disabled={props.submitting || !props.categoriesReady}
            onClick={props.onSubmit}
          >
            {props.submitting ? 'Creating…' : 'Create'}
          </Button>
          <Button type="button" variant="ghost" onClick={props.onClear} disabled={props.submitting}>
            Clear
          </Button>
        </div>
      </div>
    </Card>
  )
}

