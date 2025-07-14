import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './src/lib/auth'

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

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/wallet') || // Allow wallet auth
    pathname.startsWith('/api/debug/') || // Allow debug routes
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Get session
  let session = null
  try {
    session = await getSession(request)
  } catch (error) {
    console.error('Middleware session error:', error)
  }

  // Handle protected routes
  if (isProtectedRoute && !session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('error', 'auth_required')
    return NextResponse.redirect(url)
  }

  // Handle admin routes
  if (isAdminRoute && (!session || !session.user.isAdmin)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('error', 'admin_required')
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}