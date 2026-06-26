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

  // 1. Dapatkan session dari cookies. getSessionCookie adalah optimistic check bawaan Better Auth.
  let session: any = getSessionCookie(request)

  // Fallback: Jika getSessionCookie bernilai null (misal karena SSL termination / proxy membuat
  // deteksi protokol HTTPS gagal dan mencari nama cookie HTTP biasa sedangkan Safari hanya mengirim cookie __Secure-),
  // kita cari manual cookie secure & non-secure.
  if (!session) {
    const secureToken = request.cookies.get('__Secure-better-auth.session_token')
    const normalToken = request.cookies.get('better-auth.session_token')
    if (secureToken || normalToken) {
      session = secureToken?.value || normalToken?.value || null
    }
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  // Not authenticated → redirect to login
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    // Hindari caching redirect di router Next.js (terutama saat prefetch)
    response.headers.set('x-middleware-cache', 'no-cache')
    return response
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
