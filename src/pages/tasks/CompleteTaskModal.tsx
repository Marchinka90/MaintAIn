import { useEffect, useMemo, useRef } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

type CompleteDraft = {
  completedAtLocal: string
  cost: string
  note: string
}

export function CompleteTaskModal(props: {
  open: boolean
  title: string
  draft: CompleteDraft
  submitting: boolean
  error?: string | null
  onDraftChange: (next: CompleteDraft) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!props.open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [props.onClose, props.open])

  useEffect(() => {
    if (!props.open) return
    const t = window.setTimeout(() => {
      const el = cardRef.current?.querySelector<HTMLInputElement>('input[name="completedAtLocal"]')
      el?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [props.open])

  const costError = useMemo(() => {
    if (!props.draft.cost.trim()) return null
    const n = Number(props.draft.cost)
    if (!Number.isFinite(n)) return 'Cost must be a number'
    if (n < 0) return 'Cost must be >= 0'
    return null
  }, [props.draft.cost])

  if (!props.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <Card className="w-full max-w-lg rounded-2xl border-slate-200 bg-white p-6 shadow-lg shadow-black/20 backdrop-blur-none hover:border-slate-200">
        <div ref={cardRef}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{props.title}</h2>
            <p className="mt-1 text-sm text-slate-600">Log a completion and automatically bump the next due date.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            tone="light"
            onClick={props.onClose}
            disabled={props.submitting}
          >
            Close
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <div className="space-y-1">
              <label htmlFor="completedAtLocal" className="text-sm font-medium text-slate-700">
                Completed at
              </label>
              <input
                id="completedAtLocal"
                name="completedAtLocal"
                type="datetime-local"
                value={props.draft.completedAtLocal}
                onChange={(e) => props.onDraftChange({ ...props.draft, completedAtLocal: e.target.value })}
                className={[
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                  'border-slate-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                ].join(' ')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cost" className="text-sm font-medium text-slate-700">
                Cost (optional)
              </label>
              <input
                id="cost"
                name="cost"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={props.draft.cost}
                onChange={(e) => props.onDraftChange({ ...props.draft, cost: e.target.value })}
                aria-invalid={Boolean(costError) || undefined}
                className={[
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                  costError ? 'border-rose-300' : 'border-slate-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                ].join(' ')}
              />
              {costError ? (
                <p className="text-sm text-rose-700" role="alert">
                  {costError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="completionNote" className="text-sm font-medium text-slate-700">
              Note (optional)
            </label>
            <textarea
              id="completionNote"
              name="completionNote"
              rows={3}
              value={props.draft.note}
              onChange={(e) => props.onDraftChange({ ...props.draft, note: e.target.value })}
              placeholder="What did you do?"
              className={[
                'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900',
                'border-slate-200 placeholder:text-slate-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              ].join(' ')}
            />
          </div>

          {props.error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {props.error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              tone="light"
              onClick={props.onClose}
              disabled={props.submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              tone="light"
              onClick={props.onSubmit}
              disabled={props.submitting || Boolean(costError)}
            >
              {props.submitting ? 'Completing…' : 'Complete'}
            </Button>
          </div>
        </div>
        </div>
      </Card>
    </div>
  )
}

