import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

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
  onCancel?: () => void
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
    <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm shadow-black/5 backdrop-blur-none hover:border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create Task</h2>
          <p className="mt-1 text-sm text-slate-600">Add a recurring responsibility to your list.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={props.draft.title}
            onChange={(e) => props.onDraftChange({ ...props.draft, title: e.target.value })}
            placeholder="Replace HVAC filter"
            autoComplete="off"
            required
            aria-invalid={Boolean(props.titleError) || undefined}
            className={[
              'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
              props.titleError ? 'border-rose-300' : 'border-slate-200',
              'placeholder:text-slate-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            ].join(' ')}
          />
          {props.titleError ? (
            <p className="text-sm text-rose-700" role="alert">
              {props.titleError}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={props.draft.description}
            onChange={(e) => props.onDraftChange({ ...props.draft, description: e.target.value })}
            placeholder="Notes, steps, parts to buy…"
            autoComplete="off"
            className={[
              'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
              'border-slate-200 placeholder:text-slate-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            ].join(' ')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
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
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                !props.categoriesReady ? 'opacity-70' : '',
              ].join(' ')}
            >
              {props.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {props.categoriesError ? (
              <p className="text-sm text-rose-700" role="alert">
                {props.categoriesError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
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
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                props.startDateError ? 'border-rose-300' : 'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            />
            {props.startDateError ? (
              <p className="text-sm text-rose-700" role="alert">
                {props.startDateError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <label htmlFor="frequencyUnit" className="text-sm font-medium text-slate-700">
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
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="frequencyInterval" className="text-sm font-medium text-slate-700">
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
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                props.intervalError ? 'border-rose-300' : 'border-slate-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            />
            {props.intervalError ? (
              <p className="text-sm text-rose-700" role="alert">
                {props.intervalError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {props.onCancel ? (
            <Button type="button" variant="ghost" tone="light" onClick={props.onCancel} disabled={props.submitting}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            tone="light"
            disabled={props.submitting || !props.categoriesReady}
            onClick={props.onSubmit}
          >
            {props.submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

