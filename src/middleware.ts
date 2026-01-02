// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const COOKIE_NAME = 'ss_uid';

// Routes that must be accessible without login
const isPublicRoute = createRouteMatcher([
  '/', // landing
  '/t(.*)', // public ticket pages
  '/api/stripe/webhook', // Stripe webhook
  '/api/ticket(.*)', // ticket approve + pins are public in your design
  '/api/create-ticket', // extension can call w/ X-SS-UID even if not logged in
  '/sign-in(.*)', // auth pages
]);

// Routes that must require login (commercialization stance)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/dashboard',
]);

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function ensureGuestCookie(req: NextRequest, res: NextResponse) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) return res;

  const uid = `guest_${randomId()}`;

  res.cookies.set({
    name: COOKIE_NAME,
    value: uid,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
export default clerkMiddleware(async (auth, req) => {
  // Always mint ss_uid if missing
  let res = NextResponse.next();
  res = ensureGuestCookie(req, res);

  // Enforce protection
  if (isProtectedRoute(req)) {
    const session = await auth();

    if (!session.userId) {
      return session.redirectToSignIn();
    }
  }

  return res;
});

export const config = {
  matcher: [
    // Clerk-recommended matcher: skip Next internals + static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
