import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase client for use in Client Components (browser).
 *
 * Uses ONLY the public anon key — never the service-role key. RLS policies in
 * `db/rls.sql` are the security boundary for anything this client touches.
 *
 * Call this lazily (inside event handlers / effects), not at module top level,
 * so the module can be imported during SSR without requiring env vars.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
