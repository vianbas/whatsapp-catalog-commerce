import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Session-refresh helper invoked from the Next.js proxy (formerly
 * "middleware"). It re-issues the Supabase auth cookie on every request so
 * server components always see a fresh session, and gates `/admin` behind
 * authentication.
 *
 * Returns the `NextResponse` that the proxy must return so the refreshed
 * cookies are actually sent to the browser.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Supabase not configured yet (e.g. no .env.local). Don't construct a client
  // — it would throw on every request. Let requests through untouched; auth and
  // the admin gate simply aren't active until credentials are provided.
  if (!url || !anonKey) {
    return response
  }

  let sessionResponse = response

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          sessionResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() revalidates the token with Supabase Auth. Do not
  // insert logic between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  if (!user && isAdminRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return sessionResponse
}
