import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { UpdatePasswordForm } from './UpdatePasswordForm'

function createSupabaseClient({
  hasSession = true,
  error = null,
}: {
  hasSession?: boolean
  error?: { message: string } | null
} = {}) {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: hasSession ? { access_token: 'token' } : null },
    error: null,
  })
  const updateUser = vi.fn().mockResolvedValue({
    data: { user: error ? null : { id: 'user-1' } },
    error,
  })

  return {
    client: { auth: { getSession, updateUser } } as unknown as SupabaseClient,
    updateUser,
  }
}

async function completeForm(
  user: ReturnType<typeof userEvent.setup>,
  password = 'new-password-123',
  confirmation = password,
) {
  await user.type(await screen.findByLabelText('New password'), password)
  await user.type(screen.getByLabelText('Confirm new password'), confirmation)
}

describe('UpdatePasswordForm', () => {
  it('rejects an expired or missing recovery session', async () => {
    const { client } = createSupabaseClient({ hasSession: false })
    render(<UpdatePasswordForm supabase={client} />)

    expect(await screen.findByText(/reset link is no longer valid/)).toBeInTheDocument()
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
  })

  it('updates the password and reports success', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { client, updateUser } = createSupabaseClient()
    render(<UpdatePasswordForm supabase={client} onSuccess={onSuccess} />)

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password-123' })
    expect(await screen.findByText(/password has been updated/)).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('rejects mismatched passwords before update', async () => {
    const user = userEvent.setup()
    const { client, updateUser } = createSupabaseClient()
    render(<UpdatePasswordForm supabase={client} />)

    await completeForm(user, 'new-password-123', 'different-password')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(updateUser).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match')
  })

  it('enforces the consuming app password minimum', async () => {
    const user = userEvent.setup()
    const { client, updateUser } = createSupabaseClient()
    render(<UpdatePasswordForm supabase={client} minLength={16} />)

    await completeForm(user, 'too-short')
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(updateUser).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 16 characters')
  })

  it('shows a Supabase update error', async () => {
    const user = userEvent.setup()
    const { client } = createSupabaseClient({ error: { message: 'Password rejected' } })
    render(<UpdatePasswordForm supabase={client} />)

    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Password rejected')
  })
})
