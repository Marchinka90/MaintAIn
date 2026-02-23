import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Tone = 'dark' | 'light'

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ' +
  'transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none'

const toneRingOffset: Record<Tone, string> = {
  dark: 'focus-visible:ring-offset-slate-950',
  light: 'focus-visible:ring-offset-white',
}

const variants: Record<Tone, Record<Variant, string>> = {
  dark: {
    primary: 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 hover:bg-indigo-500',
    ghost: 'border border-slate-700 text-slate-200 hover:bg-slate-800',
    danger: 'border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15',
  },
  light: {
    primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/15 hover:bg-indigo-500',
    ghost: 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900',
    danger: 'border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-900/15 hover:bg-rose-500',
  },
}

export function Button({
  variant = 'ghost',
  tone = 'dark',
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; tone?: Tone; children: ReactNode }) {
  return (
    <button {...props} className={`${base} ${toneRingOffset[tone]} ${variants[tone][variant]} ${className}`.trim()}>
      {children}
    </button>
  )
}

