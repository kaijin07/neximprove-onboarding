import { Ship, ShieldCheck, Database, KeyRound } from 'lucide-react'

const POINTS = [
  { Icon: KeyRound, text: 'Passwords hashed with bcrypt, never stored in plain text' },
  { Icon: ShieldCheck, text: 'GSTIN validated against the official 15-character format' },
  { Icon: Database, text: 'Records saved to PostgreSQL through a validated API' },
]

// Shared layout for register and login. The left panel is hidden below lg so
// the form gets the whole screen on a phone instead of sitting under a hero
// section the user has to scroll past.
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/40 blur-3xl"
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-white/15">
              <Ship className="size-5" aria-hidden="true" />
            </span>
            Neximprove
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Customer onboarding for customs brokers.
          </h2>
          <p className="mt-4 text-brand-100">
            Register exporters and importers once, then file declarations on their
            behalf from a single dashboard.
          </p>

          <ul className="mt-10 space-y-4">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-brand-50">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-white/10">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">Full Stack Intern task submission</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Shown only on mobile, where the brand panel is hidden. */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Ship className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold text-slate-900">Neximprove</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
