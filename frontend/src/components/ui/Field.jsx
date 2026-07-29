import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'

// Labelled input with inline error text.
// The error area keeps its height whether or not a message is showing, so the
// form doesn't jump around as errors appear and disappear.
export const Field = forwardRef(function Field(
  { label, error, hint, className = '', ...inputProps },
  ref
) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        {...inputProps}
        id={id}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={[
          'block w-full rounded-lg border px-3.5 py-2.5 text-slate-900',
          'placeholder:text-slate-400',
          'transition focus:outline-none focus:ring-4',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        ].join(' ')}
      />

      <div className="min-h-5 pt-1">
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
})
