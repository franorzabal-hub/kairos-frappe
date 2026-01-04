/**
 * Next.js Middleware for Authentication
 *
 * Protects dashboard routes by checking for session cookie.
 * Redirects unauthenticated users to the login page.
 * Allows public access to authentication routes.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

/**
 * Static file extensions to ignore
 */
const STATIC_FILE_EXTENSIONS = [
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

/**
 * Paths to ignore (static assets, API routes, etc.)
 */
const IGNORED_PATHS = ["/_next", "/api", "/static", "/favicon"];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if the request is for a static file
 */
function isStaticFile(pathname: string): boolean {
  return STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Check if the path should be ignored by middleware
 */
function isIgnoredPath(pathname: string): boolean {
  return IGNORED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if the route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if the user has a valid session cookie
 * Frappe uses 'sid' cookie for session authentication
 */
function hasSessionCookie(request: NextRequest): boolean {
  const sidCookie = request.cookies.get("sid");

  // Check if sid cookie exists and is not 'Guest'
  if (!sidCookie || !sidCookie.value) {
    return false;
  }

  // 'Guest' session means user is not authenticated
  if (sidCookie.value === "Guest") {
    return false;
  }

  return true;
}

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and ignored paths
  if (isStaticFile(pathname) || isIgnoredPath(pathname)) {
    return NextResponse.next();
  }

  const isAuthenticated = hasSessionCookie(request);
  const isPublic = isPublicRoute(pathname);

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);

    // Add the original URL as a redirect parameter
    // so we can redirect back after login
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login page
  // redirect to dashboard
  if (isAuthenticated && isPublic) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    const destination = redirectUrl || "/";

    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

// ============================================================================
// Matcher Configuration
// ============================================================================

/**
 * Configure which routes the middleware should run on
 * Excludes static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
