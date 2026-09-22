import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { ForgotPasswordForm } from './ForgotPasswordForm'

function createSupabaseClient(error: { message: string } | null = null) {
  const resetPasswordForEmail = vi.fn().mockResolvedValue({
    data: {},
    error,
  })

  return {
    client: { auth: { resetPasswordForEmail } } as unknown as SupabaseClient,
    resetPasswordForEmail,
  }
}

describe('ForgotPasswordForm', () => {
  it('does not submit an invalid email address', async () => {
    const user = userEvent.setup()
    const { client, resetPasswordForEmail } = createSupabaseClient()
    render(<ForgotPasswordForm supabase={client} />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('requests a reset link without revealing account existence', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { client, resetPasswordForEmail } = createSupabaseClient()
    render(
      <ForgotPasswordForm
        supabase={client}
        redirectTo="https://preview.example.com/auth/callback"
        onSuccess={onSuccess}
      />,
    )

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'https://preview.example.com/auth/callback',
    })
    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('routes the default recovery callback to the password update page', async () => {
    const user = userEvent.setup()
    const { client, resetPasswordForEmail } = createSupabaseClient()
    render(
      <ForgotPasswordForm
        supabase={client}
        resetPath="/account/update-password"
      />,
    )

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo:
        'http://localhost:3000/auth/callback?next=%2Faccount%2Fupdate-password',
    })
  })

  it('preserves the plain callback for existing token-hash templates', async () => {
    const user = userEvent.setup()
    const { client, resetPasswordForEmail } = createSupabaseClient()
    render(<ForgotPasswordForm supabase={client} />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'http://localhost:3000/auth/callback',
    })
  })

  it('shows a Supabase reset error', async () => {
    const user = userEvent.setup()
    const { client } = createSupabaseClient({ message: 'Email rate limit exceeded' })
    render(<ForgotPasswordForm supabase={client} />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email rate limit exceeded')
  })
})
