import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Reads/writes the session via Next's cookie store.
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too. Like the
 * browser client it uses only the public anon key; the service-role key must
 * never be wired into request-scoped code that can reach the client.
 *
 * Writing cookies from a Server Component throws in Next — that's expected and
 * safely ignored here because session refresh is handled in `proxy.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — ignore. `proxy.ts` refreshes
            // the session cookie on every request instead.
          }
        },
      },
    }
  )
}
