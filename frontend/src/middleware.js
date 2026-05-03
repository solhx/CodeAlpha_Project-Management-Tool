// frontend/src/middleware.js
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

// ── REMOVED: the AUTH_ROUTES redirect that caused the infinite loop ─────────
// Old code redirected /login → /dashboard when cookie existed.
// This was FINE normally, but created a loop when:
//   DashboardLayout → router.replace('/login')   (Redux empty)
//   Middleware      → redirect back to /dashboard (cookie exists)
//   DashboardLayout → router.replace('/login')   (Redux still empty)
//   ... forever
//
// DashboardLayout now handles the "already logged in → go to dashboard"
// case properly via the tryRefresh flow, so middleware doesn't need to.

export function middleware(request) {
  const { pathname }    = request.nextUrl;
  const refreshToken    = request.cookies.get('refreshToken')?.value;

  // ── Block unauthenticated users from protected routes ──────────────────────
  // Only redirect to login if there's NO cookie at all.
  // If cookie exists, DashboardLayout's tryRefresh will validate it.
  if (!PUBLIC_ROUTES.includes(pathname) && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};