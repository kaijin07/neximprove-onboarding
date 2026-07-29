import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, Ship, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Below sm the links collapse into a menu. A menu rather than smaller inline
// links because an admin has one more link than a customer, so the widest case
// has to fit too, and full-width rows are easier to tap than cramped text.

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, adminOnly: false },
  { to: '/admin', label: 'All customers', Icon: Users, adminOnly: true },
]

const desktopLink = ({ isActive }) =>
  [
    'rounded-md px-3 py-1.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

const mobileLink = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-700 hover:bg-slate-100 active:bg-slate-100',
  ].join(' ')

export function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const links = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin)
  const roleLabel = user?.role === 'ADMIN' ? 'Customs broker' : 'Exporter / Importer'

  // Close the menu after navigating, or it stays open over the new page.
  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Awaited because signing out is now a request: the cookie is httpOnly, so
  // only the server can clear it.
  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6"
      >
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-2 rounded-md font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
            <Ship className="size-4" aria-hidden="true" />
          </span>
          <span>Neximprove</span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} className={desktopLink}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <div className="text-right">
            {/* Truncated so a long business name can't push the button off-screen. */}
            <p className="max-w-40 truncate text-sm font-medium text-slate-900 lg:max-w-64">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-auto grid size-10 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 sm:hidden"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="space-y-1">
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={mobileLink}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="px-3 pb-3">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
