import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ' +
  'transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 hover:bg-indigo-500',
  ghost: 'border border-slate-700 text-slate-200 hover:bg-slate-800',
  danger: 'border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15',
}

export function Button({
  variant = 'ghost',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`.trim()}>
      {children}
    </button>
  )
}

