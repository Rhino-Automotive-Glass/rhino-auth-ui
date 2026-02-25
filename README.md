# @rhino-automotive-glass/auth-ui

Reusable Supabase email + password authentication forms for Rhino Automotive Glass Next.js apps.

Provides **LoginForm**, **SignupForm**, and **ForgotPasswordForm** — styled with Tailwind CSS, built for the App Router (`'use client'` components).

## Installation

### 1. Configure your project to use GitHub Packages

Add a `.npmrc` file to the root of your consuming app:

```
@rhino-automotive-glass:registry=https://npm.pkg.github.com
```

### 2. Authenticate (local dev)

Create a GitHub Personal Access Token (classic) with `read:packages` scope, then:

```bash
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: <your PAT>
# Email: your-email
```

### 3. Install

```bash
npm install @rhino-automotive-glass/auth-ui
```

## Peer dependencies

Your app must have these installed:

```json
{
  "react": "^18 || ^19",
  "react-dom": "^18 || ^19",
  "next": ">=14",
  "@supabase/supabase-js": "^2",
  "@supabase/ssr": ">=0.5"
}
```

## Usage

### Prerequisites

Your consuming app needs a Supabase browser client helper. Example (`utils/supabase/client.ts`):

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Your app also needs an `/auth/callback` route to handle email confirmation code exchange. See the [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs) for the full setup.

### Login page

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { LoginForm } from '@rhino-automotive-glass/auth-ui'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm
        supabase={supabase}
        redirectTo="/dashboard"
        onSuccess={() => console.log('Logged in!')}
      />
    </div>
  )
}
```

### Signup page

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { SignupForm } from '@rhino-automotive-glass/auth-ui'

export default function SignupPage() {
  const supabase = createClient()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignupForm supabase={supabase} />
    </div>
  )
}
```

### Forgot password page

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { ForgotPasswordForm } from '@rhino-automotive-glass/auth-ui'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ForgotPasswordForm supabase={supabase} />
    </div>
  )
}
```

## Props

All forms accept:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `supabase` | `SupabaseClient` | **required** | Browser Supabase client from your app |
| `redirectTo` | `string` | `${origin}/auth/callback` | Where to redirect after auth action |
| `onSuccess` | `() => void` | — | Callback after successful auth |
| `className` | `string` | `''` | Additional CSS classes for the form |

## Redirect handling

All auth calls (`signUp`, `resetPasswordForEmail`) pass `redirectTo` explicitly to work correctly across Vercel preview deployments, production, and localhost. By default, it uses `window.location.origin + '/auth/callback'`.

Make sure all deployment URLs are added to your Supabase project's **Redirect URLs allow list** in the dashboard:

```
https://your-app.com/**
https://*.vercel.app/**
http://localhost:3000/**
```

## Publishing (maintainers)

```bash
npm login --registry=https://npm.pkg.github.com
npm run build
npm publish
```

Or push to `main` — the GitHub Actions workflow publishes automatically.

## Access control

This is a **private** package. Only members of the [Rhino-Automotive-Glass](https://github.com/Rhino-Automotive-Glass) GitHub organization (or those granted explicit access) can install it.
