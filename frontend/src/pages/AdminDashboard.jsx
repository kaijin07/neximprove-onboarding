import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'

import { client, parseApiError } from '../api/client'
import { Navbar } from '../components/Navbar'
import { Alert } from '../components/ui/Alert'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isAdmin ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isAdmin ? 'Broker' : 'Customer'}
    </span>
  )
}

// GET /api/users is admin-only on the server. The route guard on this page is
// convenience; a customer navigating here directly still gets a 403 from the API.
export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    client
      .get('/users')
      .then(({ data }) => {
        if (!cancelled) setUsers(data.users)
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const term = query.trim().toLowerCase()
  const visible = term
    ? users.filter((u) =>
        [u.name, u.email, u.gstin].some((f) => f.toLowerCase().includes(term))
      )
    : users

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Onboarded customers
            </h1>
            <p className="mt-1.5 text-slate-600">
              Every exporter and importer registered on the platform.
            </p>
          </div>
          {!loading && !error && (
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
              {users.length} {users.length === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {!error && (
          <>
            <div className="relative mb-4">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or GSTIN"
                aria-label="Search customers"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-medium text-slate-900">
                  {term ? 'No matching customers' : 'No customers yet'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {term
                    ? 'Try a different name, email or GSTIN.'
                    : 'Registrations will appear here as businesses onboard.'}
                </p>
              </div>
            ) : (
              <>
                {/* Table on desktop */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">Business</th>
                        <th scope="col" className="px-5 py-3 font-medium">GSTIN</th>
                        <th scope="col" className="px-5 py-3 font-medium">Role</th>
                        <th scope="col" className="px-5 py-3 font-medium">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visible.map((u) => (
                        <tr key={u.id} className="transition hover:bg-slate-50">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-slate-500">{u.email}</p>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs tracking-wide text-slate-700">
                            {u.gstin}
                          </td>
                          <td className="px-5 py-3.5">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards on mobile: a four-column table can't be read at 375px
                    without side-scrolling. */}
                <ul className="space-y-3 md:hidden">
                  {visible.map((u) => (
                    <li key={u.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-medium text-slate-900">{u.name}</p>
                        <RoleBadge role={u.role} />
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-500">{u.email}</p>
                      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">GSTIN</dt>
                          <dd className="font-mono text-xs tracking-wide text-slate-700">
                            {u.gstin}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Registered</dt>
                          <dd className="text-slate-700">{formatDate(u.createdAt)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
