'use client'

import { useState, type FormEvent } from 'react'
import type { AuthFormProps } from '../types'

export function SignupForm({
  supabase,
  redirectTo,
  onSuccess,
  className = '',
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    // Always pass redirectTo explicitly so auth works across all deployments
    // (Vercel previews, production, localhost). See supabase-auth-redirectTo-audit.md.
    const emailRedirectTo =
      redirectTo ?? `${window.location.origin}/auth/callback`

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // Supabase sends a confirmation email — show success message
    setSuccess(true)
    onSuccess?.()
  }

  if (success) {
    return (
      <div className={`w-full max-w-sm ${className}`}>
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
          Check your email for a confirmation link to complete your signup.
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
        <label htmlFor="signup-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-confirm-password" className="text-sm font-medium">
          Confirm password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
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
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
