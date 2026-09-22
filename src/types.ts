import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthFormProps {
  /** Supabase browser client instance from consuming app */
  supabase: SupabaseClient
  /**
   * Login destination or explicit email callback URL, depending on the form.
   * Email callback URLs must be allowed by the Supabase project's Redirect URLs.
   */
  redirectTo?: string
  /** Called after a successful auth action */
  onSuccess?: () => void
  /** Additional CSS class names for the form wrapper */
  className?: string
}
