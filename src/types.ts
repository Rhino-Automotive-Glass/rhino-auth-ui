import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthFormProps {
  /** Supabase browser client instance from consuming app */
  supabase: SupabaseClient
  /**
   * URL to redirect to after auth action completes.
   * Defaults to `${window.location.origin}/auth/callback`.
   * Must be added to your Supabase project's Redirect URLs allow list.
   */
  redirectTo?: string
  /** Called after a successful auth action */
  onSuccess?: () => void
  /** Additional CSS class names for the form wrapper */
  className?: string
}
