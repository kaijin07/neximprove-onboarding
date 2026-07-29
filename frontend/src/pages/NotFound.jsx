import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { status } = useAuth()
  const home = status === 'authenticated' ? '/dashboard' : '/register'

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="font-mono text-sm font-medium text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-slate-600">
          That page doesn&apos;t exist or has moved.
        </p>
        <Link
          to={home}
          className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Go back
        </Link>
      </div>
    </div>
  )
}
