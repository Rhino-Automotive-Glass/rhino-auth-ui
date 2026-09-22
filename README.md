# @rhino-automotive-glass/auth-ui

Reusable Supabase email-and-password authentication forms for Rhino Automotive Glass Next.js App Router projects.

Exports `AuthLayout`, `LoginForm`, `SignupForm`, `ForgotPasswordForm`, and `UpdatePasswordForm`. Consuming apps own routing, Supabase clients, email templates, and authorization policy.

## Requirements

- Next.js 14 or newer
- React 18 or 19
- Tailwind CSS 4
- `@supabase/ssr` and `@supabase/supabase-js` 2.x
- A production SMTP provider for signup confirmation and password recovery emails

Never expose a Supabase secret or `service_role` key in browser code. Use a publishable key, or a legacy `anon` key when migrating an existing project.

## Install

Configure GitHub Packages in the consuming app's `.npmrc`:

```ini
@rhino-automotive-glass:registry=https://npm.pkg.github.com
```

Authenticate with a GitHub token that has `read:packages`, then install:

```bash
npm install @rhino-automotive-glass/auth-ui
```

Import Tailwind and the package source registration in `app/globals.css`:

```css
@import "tailwindcss";
@import "@rhino-automotive-glass/auth-ui/styles.css";
```

Without the second import, Tailwind does not scan package components and their utility classes are omitted.

## Architecture

Package responsibilities:

- Render accessible auth forms and loading, error, and success states.
- Call supplied Supabase browser client.
- Send deployment-aware email redirect URLs.
- Validate email and password inputs before API calls.

Consuming app responsibilities:

- Create browser and server Supabase clients.
- Provide `/login`, `/signup`, `/forgot-password`, `/reset-password`, and `/auth/callback` routes.
- Configure Supabase redirect URLs, email templates, password policy, and SMTP.
- Protect application routes and data independently of these UI forms.

## Supabase clients

Create a browser client in `lib/supabase-browser.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
```

Use the same variable names in every Vercel environment. Vercel preview deployments need their own environment values.

## Pages

### Login

```tsx
'use client'

import { LoginForm } from '@rhino-automotive-glass/auth-ui'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const supabase = createClient()

  return <LoginForm supabase={supabase} redirectTo="/dashboard" />
}
```

Successful login performs a full-page navigation to `redirectTo`. Pass `onSuccess` when the app needs custom navigation instead.

### Signup

```tsx
'use client'

import { SignupForm } from '@rhino-automotive-glass/auth-ui'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
  const supabase = createClient()

  return <SignupForm supabase={supabase} minLength={8} />
}
```

`SignupForm` detects whether Supabase returned an active session. Projects with Confirm Email enabled show confirmation instructions; projects with it disabled show an immediately ready account.

### Forgot password

For Supabase's PKCE/default confirmation link flow, provide the page that renders `UpdatePasswordForm`:

```tsx
'use client'

import { ForgotPasswordForm } from '@rhino-automotive-glass/auth-ui'
import { createClient } from '@/lib/supabase-browser'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  return (
    <ForgotPasswordForm
      supabase={supabase}
      resetPath="/reset-password"
    />
  )
}
```

This sends users to `/auth/callback?next=/reset-password`. The callback exchanges the PKCE code, stores the recovery session in cookies, then follows the validated `next` path.

Existing apps with custom token-hash email templates can omit `resetPath`. Their callback can route `type=recovery` directly to `/reset-password`.

### Update password

```tsx
'use client'

import { UpdatePasswordForm } from '@rhino-automotive-glass/auth-ui'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  return (
    <UpdatePasswordForm
      supabase={supabase}
      minLength={8}
      onSuccess={() => router.replace('/dashboard')}
    />
  )
}
```

`UpdatePasswordForm` checks for a session before showing the form. Expired, consumed, or cross-browser recovery links display an invalid-link state.

Use the same `minLength` for signup and password update. It must be at least the Supabase project's configured minimum.

## Auth callback

Create `app/auth/callback/route.ts`. This example accepts PKCE codes and optional token-hash email templates, rejects unsafe redirects, and always sends recovery links to the password update page.

```ts
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const VALID_OTP_TYPES: EmailOtpType[] = [
  'invite',
  'signup',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function getSafeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return '/'
  }

  return value
}

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = getSafeNextPath(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (searchParams.has('error')) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const supabase = await createClient()

  if (tokenHash && type && VALID_OTP_TYPES.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (!error) {
      const destination = type === 'recovery' ? '/reset-password' : next
      return NextResponse.redirect(new URL(destination, origin))
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

Initialize server clients inside request handlers. Do not store user-specific Supabase clients in module scope on Vercel.

## Token-hash email templates

Token-hash templates are optional when using PKCE. Apps that use them should send email links to the callback route:

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
```

For Reset Password, use:

```text
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
```

When using these templates, omit `resetPath` from `ForgotPasswordForm`; the callback identifies `type=recovery` and routes to `/reset-password`.

## Vercel and Supabase configuration

Add every trusted deployment pattern under Supabase Authentication → URL Configuration → Redirect URLs:

```text
https://your-production-domain.com/**
https://*-your-vercel-team.vercel.app/**
http://localhost:3000/**
```

Prefer exact production domains. Scope preview wildcards to your Vercel team or project.

Configure custom SMTP before production. Supabase's default sender is rate-limited, best-effort, and restricted to authorized team addresses.

## AuthLayout

```tsx
import { AuthLayout } from '@rhino-automotive-glass/auth-ui'

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthLayout
      backgroundImage="/auth-background.webp"
      backgroundAlt="Company background"
      title="My App"
      subtitle="Secure account access"
    >
      {children}
    </AuthLayout>
  )
}
```

The image must exist in the consuming app's `public` directory.

## API

```ts
import {
  AuthLayout,
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
  UpdatePasswordForm,
} from '@rhino-automotive-glass/auth-ui'

import type {
  AuthLayoutProps,
  AuthFormProps,
  SignupFormProps,
  ForgotPasswordFormProps,
  UpdatePasswordFormProps,
} from '@rhino-automotive-glass/auth-ui'
```

Common form props:

| Prop | Type | Description |
| --- | --- | --- |
| `supabase` | `SupabaseClient` | Required browser client |
| `redirectTo` | `string` | Login destination or explicit email callback URL, depending on form |
| `onSuccess` | `() => void` | Called after successful Supabase operation |
| `className` | `string` | Extra wrapper classes |

Form-specific behavior:

| Component | Prop/default | Behavior |
| --- | --- | --- |
| `LoginForm` | `redirectTo="/"` | Destination after login when `onSuccess` is absent |
| `SignupForm` | `minLength={8}` | Client password floor; email callback defaults to `${origin}/auth/callback` |
| `ForgotPasswordForm` | `resetPath` optional | Adds validated post-callback destination for PKCE recovery |
| `ForgotPasswordForm` | `redirectTo` optional | Overrides complete recovery email callback URL |
| `UpdatePasswordForm` | `minLength={8}` | Client password floor |

## Verification and publishing

```bash
npm test
npm run build
npm pack --dry-run
```

Pushes to `main` run tests, build the package, then publish to GitHub Packages.

Package access is restricted to Rhino Automotive Glass organization members and explicitly authorized users.
