'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UpdatePasswordFormProps {
  /** Supabase browser client instance from consuming app */
  supabase: SupabaseClient
  /** Called after the password has been changed successfully */
  onSuccess?: () => void
  /** Additional CSS class names for the form wrapper */
  className?: string
  /**
   * Minimum accepted password length. Keep this at or above the project's
   * Auth `minimum_password_length`, or the form will accept passwords the
   * server then rejects.
   */
  minLength?: number
}

/**
 * Second half of the password reset flow: the user has followed the link in
 * their recovery email, holds a recovery session, and sets a new password here.
 *
 * ForgotPasswordForm only sends the email. Without this form the flow dead-ends
 * — the recipient lands authenticated but with no way to change anything.
 */
export function UpdatePasswordForm({
  supabase,
  onSuccess,
  className = '',
  minLength = 8,
}: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  // updateUser silently targets nobody without a session. Recovery links are
  // single-use and expire, and are often opened in a different browser than the
  // one that requested them, so check before showing a form that cannot work.
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setHasSession(Boolean(data.session))
      })
      .catch(() => {
        if (!cancelled) setHasSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [supabase])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters`)
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSuccess(true)
    onSuccess?.()
  }

  if (hasSession === null) {
    return (
      <div className={`w-full max-w-sm ${className}`}>
        <p className="text-sm text-slate-500">Checking your reset link...</p>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className={`w-full max-w-sm ${className}`}>
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          This password reset link is no longer valid. It may have expired, been
          used already, or been opened in a different browser. Request a new one.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className={`w-full max-w-sm ${className}`}>
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          Your password has been updated. You can now sign in with it.
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
          htmlFor="new-password"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 text-base bg-white text-slate-800 border border-slate-300 rounded-lg transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-new-password"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Confirm new password
        </label>
        <input
          id="confirm-new-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
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
            Updating password...
          </span>
        ) : (
          'Update password'
        )}
      </button>
    </form>
  )
}
