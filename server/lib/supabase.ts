import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { Request, Response } from 'express'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN
const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * Per-request RLS-respecting client. Uses the publishable (anon) key + the
 * user's session cookies so Supabase enforces RLS policies via auth.uid().
 * Must be used for ALL user-data reads and writes.
 */
export function serverClient(req: Request, res: Response) {
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        const cookies = req.cookies as Record<string, string>
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookie(name, value, {
            ...options,
            httpOnly: true,
            secure: IS_PROD,
            sameSite: IS_PROD ? 'none' : 'lax',
            // Only scope the cookie to a parent domain in production. In dev the
            // browser is on localhost, where any Domain attribute (e.g. an
            // accidental ".stellita.app" left in .env.local) makes the browser
            // REJECT the cookie → the session never persists. Host-only in dev.
            domain: IS_PROD ? COOKIE_DOMAIN || undefined : undefined,
          })
        }
      },
    },
  })
}

/**
 * Admin (service-role) client. Bypasses RLS entirely.
 * Use ONLY for: usage_events inserts, models table reads, and public
 * share-token lookups. Never expose to the user or use for user data.
 */
export function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
