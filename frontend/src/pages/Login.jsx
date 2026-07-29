import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'

import { loginSchema } from '../schemas/auth.schema'
import { useAuth } from '../context/AuthContext'
import { parseApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState(null)

  // Set by the axios interceptor when a stored token was rejected.
  const sessionExpired = searchParams.get('expired') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onBlur' })

  async function onSubmit(values) {
    setFormError(null)
    try {
      const user = await login(values)
      // Back to whatever page the guard interrupted, if any.
      const intended = location.state?.from
      navigate(intended ?? (user.role === 'ADMIN' ? '/admin' : '/dashboard'), {
        replace: true,
      })
    } catch (err) {
      setFormError(parseApiError(err).message)
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access your onboarding dashboard.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {sessionExpired && !formError && (
          <Alert tone="info" className="mb-5">
            Your session expired. Please sign in again.
          </Alert>
        )}

        {formError && (
          <Alert tone="error" className="mb-5">
            {formError}
          </Alert>
        )}

        <Field
          label="Email address"
          type="email"
          placeholder="ops@acmeexports.com"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />

        <Field
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Signing in' : 'Sign in'}
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{' '}
          <Link
            to="/register"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
