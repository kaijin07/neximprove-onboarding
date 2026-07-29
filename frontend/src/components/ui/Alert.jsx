import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const TONES = {
  error: { box: 'bg-red-50 text-red-800 border-red-200', Icon: AlertTriangle },
  success: { box: 'bg-emerald-50 text-emerald-800 border-emerald-200', Icon: CheckCircle2 },
  info: { box: 'bg-brand-50 text-brand-800 border-brand-200', Icon: Info },
}

// Form-level message, for errors that don't belong to a single field.
export function Alert({ tone = 'error', children, className = '' }) {
  const { box, Icon } = TONES[tone] ?? TONES.info

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${box} ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
