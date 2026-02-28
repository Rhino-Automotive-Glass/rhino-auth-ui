# @rhino-automotive-glass/auth-ui

Reusable Supabase email + password authentication forms for Rhino Automotive Glass Next.js apps.

Provides **AuthLayout**, **LoginForm**, **SignupForm**, and **ForgotPasswordForm** — styled with Tailwind CSS, built for the App Router (`'use client'` components).

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

### 4. Configure Tailwind to scan the package

Add this `@source` directive to your app's global CSS file (e.g. `globals.css`) so Tailwind generates the utility classes used by the components:

```css
@import "tailwindcss";
@source "../../node_modules/@rhino-automotive-glass/auth-ui/dist";
```

Without this, Tailwind won't scan `node_modules` and the component styles won't be applied.

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

### AuthLayout

A full-screen layout with a background image, gradient overlay, and a centered card. Wrap your auth pages with it:

```tsx
import { AuthLayout } from '@rhino-automotive-glass/auth-ui'

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthLayout
      backgroundImage="/your-background.webp"
      backgroundAlt="Company background"
      title="My App"
      subtitle="Welcome back"
    >
      {children}
    </AuthLayout>
  )
}
```

The background image must exist in your app's `public/` directory.

### Login page

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { LoginForm } from '@rhino-automotive-glass/auth-ui'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <LoginForm
      supabase={supabase}
      redirectTo="/dashboard"
      onSuccess={() => console.log('Logged in!')}
    />
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

  return <SignupForm supabase={supabase} />
}
```

### Forgot password page

```tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { ForgotPasswordForm } from '@rhino-automotive-glass/auth-ui'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  return <ForgotPasswordForm supabase={supabase} />
}
```

### Full example (layout + login)

```tsx
// app/(auth)/layout.tsx
import { AuthLayout } from '@rhino-automotive-glass/auth-ui'

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthLayout
      backgroundImage="/parabrisas-medallones-van-camioneta-autobuses.webp"
      backgroundAlt="Rhino Automotive Glass"
      title="Rhino Stock"
      subtitle="Sistema de Inventario"
    >
      {children}
    </AuthLayout>
  )
}
```

```tsx
// app/(auth)/login/page.tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { LoginForm } from '@rhino-automotive-glass/auth-ui'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido</h2>
        <p className="text-sm text-slate-600">
          Inicia sesión para acceder al sistema
        </p>
      </div>
      <LoginForm supabase={supabase} redirectTo="/" />
    </div>
  )
}
```

## Exports

```ts
import {
  AuthLayout,
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
} from '@rhino-automotive-glass/auth-ui'

import type {
  AuthLayoutProps,
  AuthFormProps,
} from '@rhino-automotive-glass/auth-ui'
```

## Props

### AuthLayout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundImage` | `string` | **required** | Path to background image in your `public/` dir |
| `backgroundAlt` | `string` | `''` | Alt text for the background image |
| `title` | `string` | **required** | Large heading above the card |
| `subtitle` | `string` | — | Subtitle below the heading |
| `children` | `ReactNode` | **required** | Content rendered inside the card |

### LoginForm / SignupForm / ForgotPasswordForm

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
