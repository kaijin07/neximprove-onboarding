import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Loading" />
    </div>
  )
}

// Route guard, applied at the route definition so a new page can't ship
// unprotected by accident. This is for user experience only: the real check is
// on the server, which returns 403 to a customer hitting an admin endpoint
// whatever the UI shows.
export function ProtectedRoute({ roles, children }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />

  if (status !== 'authenticated') {
    // Remember the intended page so login can return there.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Keeps a signed-in user off /login and /register.
export function PublicOnlyRoute({ children }) {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  return children
}
