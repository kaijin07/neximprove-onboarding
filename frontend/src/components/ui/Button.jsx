import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-200 disabled:bg-brand-300',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
}

// Disabled while loading, so a slow request can't be submitted twice by an
// impatient double-click.
export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
        'text-sm font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-4',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
