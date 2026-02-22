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
        'rounded-2xl border border-white/15 bg-white/5 shadow-[0_24px_80px_var(--shadow)] backdrop-blur',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

