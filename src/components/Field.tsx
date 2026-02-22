import { type ChangeEvent, type ReactNode, useId } from 'react'

type BaseProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
  error?: string | null
  hint?: ReactNode
}

function Label({ id, label }: { id: string; label: string }) {
  return (
    <label htmlFor={id} className="text-sm text-slate-400">
      {label}
    </label>
  )
}

function ErrorText({ id, error }: { id: string; error: string }) {
  return (
    <p id={id} className="text-sm text-rose-300">
      {error}
    </p>
  )
}

export function TextField(props: BaseProps & { type?: 'text' | 'password' }) {
  const reactId = useId()
  const id = `${props.name}-${reactId}`
  const describedById = props.error ? `${id}-error` : undefined

  return (
    <div className="space-y-1">
      <Label id={id} label={props.label} />
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.required}
        disabled={props.disabled}
        aria-invalid={Boolean(props.error) || undefined}
        aria-describedby={describedById}
        className={[
          'w-full rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
          'border-slate-700 placeholder:text-slate-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          props.error ? 'border-rose-500/40' : '',
        ].join(' ')}
      />
      {props.hint ? <div className="text-sm text-slate-400">{props.hint}</div> : null}
      {props.error ? <ErrorText id={`${id}-error`} error={props.error} /> : null}
    </div>
  )
}

export function TextareaField(props: BaseProps & { rows?: number }) {
  const reactId = useId()
  const id = `${props.name}-${reactId}`
  const describedById = props.error ? `${id}-error` : undefined

  return (
    <div className="space-y-1">
      <Label id={id} label={props.label} />
      <textarea
        id={id}
        name={props.name}
        value={props.value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.required}
        disabled={props.disabled}
        rows={props.rows ?? 4}
        aria-invalid={Boolean(props.error) || undefined}
        aria-describedby={describedById}
        className={[
          'w-full resize-y rounded-xl border bg-slate-800 px-3 py-2 text-sm text-slate-200',
          'border-slate-700 placeholder:text-slate-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          props.error ? 'border-rose-500/40' : '',
        ].join(' ')}
      />
      {props.hint ? <div className="text-sm text-slate-400">{props.hint}</div> : null}
      {props.error ? <ErrorText id={`${id}-error`} error={props.error} /> : null}
    </div>
  )
}

