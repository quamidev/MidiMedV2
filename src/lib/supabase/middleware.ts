/**
 * Supabase Middleware Helper
 *
 * Creates a Supabase client for use in Next.js middleware.
 * Handles session refresh and cookie management for the auth flow.
 *
 * Usage in middleware.ts:
 *   import { createMiddlewareClient } from '@/lib/supabase/middleware'
 *
 *   export async function middleware(request: NextRequest) {
 *     const { supabase, response } = createMiddlewareClient(request)
 *     const { data: { user } } = await supabase.auth.getUser()
 *     // ... handle routing based on auth state
 *     return response
 *   }
 *
 * Created: 2026-02-10 - Initial setup for MidiMed v2
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client configured for Next.js middleware.
 * Handles cookie reading/writing for session management during request processing.
 *
 * @param request - The incoming Next.js request
 * @returns Object containing the Supabase client and the response to be returned
 */
export function createMiddlewareClient(request: NextRequest) {
  // Create an unmodified response to start with
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update cookies on the request (for subsequent middleware/handlers)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // Create new response with updated request headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Updates the response with redirected URL while preserving cookies.
 * Use this when you need to redirect but keep the session cookies intact.
 *
 * @param request - The incoming Next.js request
 * @param response - The current response with cookies
 * @param redirectUrl - The URL to redirect to
 * @returns New redirect response with preserved cookies
 */
export function createRedirectResponse(
  request: NextRequest,
  response: NextResponse,
  redirectUrl: string
) {
  const url = request.nextUrl.clone()
  url.pathname = redirectUrl

  const redirectResponse = NextResponse.redirect(url)

  // Preserve cookies from the original response
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value)
  })

  return redirectResponse
}
