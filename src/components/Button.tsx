import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg) ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'border border-white/15 bg-gradient-to-br from-[color:var(--accent)]/20 to-[color:var(--accent2)]/15 hover:border-white/25',
  ghost: 'border border-white/15 bg-transparent hover:border-white/25',
  danger: 'border border-rose-400/40 bg-rose-400/10 hover:border-rose-400/55',
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

