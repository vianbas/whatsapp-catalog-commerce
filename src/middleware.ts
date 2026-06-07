import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Edge middleware — refreshes the Supabase session and protects /admin.
 *
 * Using middleware.ts (deprecated in Next.js 16 but still functional) instead
 * of proxy.ts because proxy.ts is Node.js-only and Cloudflare Workers require
 * Edge runtime. The Next.js 16 upgrade guide explicitly endorses this pattern.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images:
     * - _next/static, _next/image
     * - favicon and common static file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
