import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'

import { registerSchema } from '../schemas/auth.schema'
import { useAuth } from '../context/AuthContext'
import { parseApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

export default function Register() {
  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    // Same schema the API validates against.
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  async function onSubmit(values) {
    setFormError(null)
    try {
      await createAccount(values)
      // Straight to the dashboard, no separate login step.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)

      // Attach server errors (like a duplicate email) to the field that caused
      // them instead of showing a banner and leaving the user to guess.
      const entries = Object.entries(fieldErrors)
      for (const [field, msg] of entries) {
        setError(field, { type: 'server', message: msg })
      }
      if (entries.length === 0) setFormError(message)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as an exporter or importer to access your dashboard."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <Alert tone="error" className="mb-5">
            {formError}
          </Alert>
        )}

        <Field
          label="Business name"
          placeholder="Acme Exports Pvt Ltd"
          autoComplete="organization"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />

        <Field
          label="Email address"
          type="email"
          placeholder="ops@acmeexports.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Field
          label="GSTIN"
          placeholder="27AAPFU0939F1ZV"
          autoComplete="off"
          spellCheck="false"
          maxLength={15}
          // GSTINs are always uppercase, so convert as they type rather than
          // failing validation for something the user can't see is wrong.
          onInput={(e) => {
            e.target.value = e.target.value.toUpperCase()
          }}
          hint="15 characters: 2-digit state code, 10-character PAN, then 3 more."
          error={errors.gstin?.message}
          {...register('gstin')}
        />

        <Field
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          hint="Minimum 8 characters, including a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Creating account' : 'Create account'}
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
