// Middleware for route protection
// Redirects unauthenticated users away from protected routes
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ["/admin", "/operator", "/bpjs", "/profile", "/dashboard"]

  // Check if current path starts with any protected route
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected) {
    // Check for session token in cookies
    const sessionToken = request.cookies.get("next-auth.session-token")?.value
      || request.cookies.get("__Secure-next-auth.session-token")?.value

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/operator/:path*",
    "/bpjs/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
  ],
}
