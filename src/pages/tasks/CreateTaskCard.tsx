import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextareaField, TextField } from '../../components/Field'

export type TaskDraft = {
  title: string
  description: string
  category: string
  active: boolean
}

export function CreateTaskCard(props: {
  draft: TaskDraft
  onDraftChange: (next: TaskDraft) => void
  onSubmit: () => void
  onClear: () => void
  submitting: boolean
  titleError: string | null
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

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            <input
              name="active"
              type="checkbox"
              checked={props.draft.active}
              onChange={(e) => props.onDraftChange({ ...props.draft, active: e.target.checked })}
              className="h-4 w-4 accent-indigo-500"
            />
            <span>Active</span>
          </label>
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

