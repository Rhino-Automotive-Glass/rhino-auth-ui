import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SignupForm } from './SignupForm'

function createSupabaseClient({
  hasSession = false,
  error = null,
}: {
  hasSession?: boolean
  error?: { message: string } | null
} = {}) {
  const signUp = vi.fn().mockResolvedValue({
    data: {
      user: error ? null : { id: 'user-1' },
      session: !error && hasSession ? { access_token: 'token' } : null,
    },
    error,
  })

  return {
    client: { auth: { signUp } } as unknown as SupabaseClient,
    signUp,
  }
}

async function completeForm(
  user: ReturnType<typeof userEvent.setup>,
  values: { email?: string; password?: string; confirmation?: string } = {},
) {
  await user.type(screen.getByLabelText('Email'), values.email ?? 'user@example.com')
  await user.type(screen.getByLabelText('Password', { exact: true }), values.password ?? 'password-123')
  await user.type(screen.getByLabelText('Confirm password'), values.confirmation ?? values.password ?? 'password-123')
}

describe('SignupForm', () => {
  it('does not submit an invalid email address', async () => {
    const user = userEvent.setup()
    const { client, signUp } = createSupabaseClient()
    render(<SignupForm supabase={client} />)

    await completeForm(user, { email: 'not-an-email' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).not.toHaveBeenCalled()
  })

  it('honors a consuming app password minimum', async () => {
    const user = userEvent.setup()
    const { client, signUp } = createSupabaseClient()
    render(<SignupForm supabase={client} minLength={12} />)

    await completeForm(user, { password: 'short-pass' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 12 characters.')
  })

  it('reports an immediately active account when confirmation is disabled', async () => {
    const user = userEvent.setup()
    const { client } = createSupabaseClient({ hasSession: true })
    render(<SignupForm supabase={client} />)

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Your account is ready. You can continue.')).toBeInTheDocument()
  })

  it('requests signup with the configured callback and reports confirmation', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { client, signUp } = createSupabaseClient()
    render(
      <SignupForm
        supabase={client}
        redirectTo="https://preview.example.com/auth/callback"
        onSuccess={onSuccess}
      />,
    )

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password-123',
      options: { emailRedirectTo: 'https://preview.example.com/auth/callback' },
    })
    expect(await screen.findByText(/Check your email/)).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('rejects mismatched passwords before signup', async () => {
    const user = userEvent.setup()
    const { client, signUp } = createSupabaseClient()
    render(<SignupForm supabase={client} />)

    await completeForm(user, { confirmation: 'different-password' })
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(signUp).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
  })

  it('shows a Supabase signup error', async () => {
    const user = userEvent.setup()
    const { client } = createSupabaseClient({ error: { message: 'Signup is disabled' } })
    render(<SignupForm supabase={client} />)

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Signup is disabled')
  })
})
