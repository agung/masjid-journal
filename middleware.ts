import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Routes that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register']
// API routes to skip middleware
const SKIP_PATHS = ['/api/', '/_next/', '/icons/', '/manifest.json', '/favicon.ico', '/logo.svg', '/sw.js']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, internal Next.js routes, and API auth routes
  if (pathname.startsWith('/_') || SKIP_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const session = getSessionCookie(request)

  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  // Not authenticated → redirect to login
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already authenticated → redirect away from auth pages
  if (session && isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
