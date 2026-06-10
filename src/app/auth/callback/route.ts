import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Auth callback for email-link flows (magic link, invite, password recovery).
 *
 * Supabase redirects here with a `?code=` (PKCE). We exchange it for a session
 * — the server client writes the session cookie — then send the user on to a
 * safe `next` path. On any failure we bounce back to /login with an error flag.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // Only allow relative, single-leading-slash paths to avoid open redirects.
  const nextParam = searchParams.get("next")
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
