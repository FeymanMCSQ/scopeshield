// /src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ss_uid';

// Keep it simple: random ID generator (no deps)
function randomId() {
  // 16 bytes -> 32 hex chars
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip static assets and next internals
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/api/stripe/webhook') // optional: avoid any weirdness for webhooks
  ) {
    return res;
  }

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
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
