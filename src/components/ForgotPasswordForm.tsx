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
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          If an account exists for that email, you will receive a password reset
          link shortly.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-5 w-full max-w-sm ${className}`}
      noValidate
    >
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
          <svg
            className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="forgot-email"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
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
          className="w-full px-4 py-2.5 text-base bg-white text-slate-800 border border-slate-300 rounded-lg transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center w-full rounded-lg font-medium text-base px-4 py-2.5 bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Sending reset link...
          </span>
        ) : (
          'Send reset link'
        )}
      </button>
    </form>
  )
}
