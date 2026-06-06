import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which paths require the user to be logged in
const protectedPaths = [
  '/admin', 
  '/manager', 
  '/hr', 
  '/employee', 
  '/dashboard', 
  '/org-chart', 
  '/directory'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPage = pathname.startsWith('/login')

  // If they try to access a protected dashboard without a token, instantly redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If they are already logged in and try to go to the login page, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Ensure the middleware doesn't run on static files and Next.js internals
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
