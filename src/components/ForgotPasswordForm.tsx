'use client'

import { useState, type FormEvent } from 'react'
import type { AuthFormProps } from '../types'

/** ForgotPasswordForm only needs supabase, redirectTo, onSuccess, and className */
type ForgotPasswordFormProps = Omit<AuthFormProps, never>

export function ForgotPasswordForm({
  supabase,
  redirectTo,
  onSuccess,
  className = '',
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Always pass redirectTo explicitly — required for multi-deployment setups.
    // The user will be sent to this URL after clicking the reset link in their email.
    const emailRedirectTo =
      redirectTo ?? `${window.location.origin}/auth/callback`

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: emailRedirectTo }
    )

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess(true)
    onSuccess?.()
  }

  if (success) {
    return (
      <div className={`w-full max-w-sm ${className}`}>
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
          If an account exists for that email, you will receive a password reset
          link shortly.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-4 w-full max-w-sm ${className}`}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending reset link...' : 'Send reset link'}
      </button>
    </form>
  )
}
