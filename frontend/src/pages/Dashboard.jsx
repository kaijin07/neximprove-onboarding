import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Building2, Calendar, Mail, Receipt, Users } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/Navbar'
import { Alert } from '../components/ui/Alert'

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function DetailRow({ Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        {/* break-all so a long email wraps instead of causing side-scroll on a phone */}
        <dd
          className={`mt-0.5 break-all text-slate-900 ${mono ? 'font-mono text-sm tracking-wide' : ''}`}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
      <div className="h-5 w-40 rounded bg-slate-200" />
      <div className="mt-6 space-y-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-8 shrink-0 rounded-lg bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdmin, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetches the profile from GET /api/users/me on mount, so the dashboard shows
  // current server data rather than whatever was cached at login.
  useEffect(() => {
    let cancelled = false
    refreshUser()
      .catch(() => {
        if (!cancelled) setError('Could not load your profile. Please refresh.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1.5 text-slate-600">
            Your onboarding profile, fetched live from the API.
          </p>
        </div>

        {error && (
          <Alert tone="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {loading && !user ? (
              <SkeletonCard />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                  <h2 className="font-semibold text-slate-900">Profile</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    {isAdmin ? 'Customs broker' : 'Onboarded'}
                  </span>
                </div>

                <dl className="divide-y divide-slate-100 px-6 py-2">
                  <DetailRow Icon={Building2} label="Business name" value={user?.name} />
                  <DetailRow Icon={Mail} label="Email address" value={user?.email} />
                  <DetailRow Icon={Receipt} label="GSTIN" value={user?.gstin} mono />
                  <DetailRow
                    Icon={Calendar}
                    label="Registered on"
                    value={formatDate(user?.createdAt)}
                  />
                </dl>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Account status</h2>
              {/* An admin is the broker, so the customer wording doesn't apply. */}
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {isAdmin
                  ? 'You have broker access. You can view every onboarded exporter and importer, and file declarations on their behalf.'
                  : 'Your details are verified and stored. A customs broker can now file declarations on your behalf.'}
              </p>
              <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-sm">
                <span className="text-slate-500">Account type</span>
                <p className="mt-0.5 font-medium text-slate-900">
                  {isAdmin ? 'Administrator' : 'Exporter / Importer'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-6 transition hover:border-brand-300 hover:bg-brand-100"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-brand-900">All customers</span>
                  <span className="block text-sm text-brand-700">
                    View every onboarded business
                  </span>
                </span>
              </Link>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
