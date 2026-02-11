/**
 * Next.js Authentication Middleware
 *
 * Handles route protection and session refresh for the MidiMed application.
 * - Protects authenticated routes by redirecting to /login if no session
 * - Allows public routes without authentication
 * - Bypasses auth for webhook routes
 * - Refreshes session cookies on each request to prevent expiration
 *
 * Created: 2026-02-10 - Initial middleware for MV2-006
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient, createRedirectResponse } from '@/lib/supabase/middleware'

/**
 * Public routes that do not require authentication.
 * These pages are accessible to all visitors.
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/contact',
  '/finish-sign-in',
  '/payment/success',
  '/payment/failed',
  '/payment/cancelled',
]

/**
 * Checks if the given pathname is a public route.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route)
}

/**
 * Checks if the given pathname is a webhook route.
 * Webhook routes bypass authentication to allow external services to call them.
 */
function isWebhookRoute(pathname: string): boolean {
  return pathname.startsWith('/api/webhooks')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Allow webhook routes without authentication
  if (isWebhookRoute(pathname)) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
  // This also refreshes the session cookie if valid
  const { supabase, response } = createMiddlewareClient(request)

  // Get the current user session
  // IMPORTANT: Use getUser() instead of getSession() for security
  // getUser() validates the JWT with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user session exists, redirect to login
  if (!user) {
    return createRedirectResponse(request, response, '/login')
  }

  // User is authenticated, allow the request to proceed
  // Return the response to preserve any cookie updates from session refresh
  return response
}

/**
 * Matcher configuration for Next.js middleware.
 *
 * Runs on all routes except:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon and image assets
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
