import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

function createSupabaseClient(error: { message: string } | null = null) {
  const signInWithPassword = vi.fn().mockResolvedValue({
    data: { user: error ? null : { id: 'user-1' }, session: error ? null : { access_token: 'token' } },
    error,
  })

  return {
    client: { auth: { signInWithPassword } } as unknown as SupabaseClient,
    signInWithPassword,
  }
}

describe('LoginForm', () => {
  it('does not submit an invalid email address', async () => {
    const user = userEvent.setup()
    const { client, signInWithPassword } = createSupabaseClient()
    render(<LoginForm supabase={client} />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('signs in and reports success', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { client, signInWithPassword } = createSupabaseClient()
    render(<LoginForm supabase={client} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password-123',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('shows a Supabase sign-in error', async () => {
    const user = userEvent.setup()
    const { client } = createSupabaseClient({ message: 'Invalid login credentials' })
    render(<LoginForm supabase={client} />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
  })
})
