import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './src/lib/auth'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/user',
  '/api/twitter',
  '/api/claims',
  '/api/tasks',
]

// Routes that require admin access
const adminRoutes = [
  '/admin',
  '/api/admin',
]

// Routes that should redirect if authenticated
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Verify token if present
  let session = null
  if (token) {
    session = await verifyToken(token)
  }

  // Handle protected routes
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('error', 'auth_required')
    return NextResponse.redirect(url)
  }

  // Handle admin routes
  if (isAdminRoute) {
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('error', 'auth_required')
      return NextResponse.redirect(url)
    }

    // Check admin status - would need to fetch from DB
    // For now, we'll pass this check to the API routes
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}