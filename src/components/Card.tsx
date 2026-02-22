import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={[
        'rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/20 backdrop-blur',
        'transition-colors duration-200 hover:border-slate-700',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

