import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATHS = [
  "/board/new",
  "/profile/edit",
  "/dashboard",
  "/chat",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  // 1. Origin-header check for mutating /api/ requests.
  //    NextAuth's own routes are matcher-excluded.
  const method = request.method;
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    const origin = request.headers.get("origin");
    const expectedOrigin = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).origin
      : null;
    if (origin && expectedOrigin && origin !== expectedOrigin) {
      return NextResponse.json({ error: "BAD_ORIGIN" }, { status: 403 });
    }
  }

  // 2. Auth-redirect for protected paths.
  //    request.auth is provided by the auth() wrapper from NextAuth v5,
  //    which handles cookie name, secret, and decoding under the hood.
  if (isProtected(pathname) && !request.auth) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 3. Per-request CSP nonce + headers
  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' wss: https://*.sentry.io",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  // Run on everything except NextAuth's own routes (which handle their own CSRF),
  // static asset prefixes, and favicon.
  matcher: [
    {
      source: "/((?!api/auth|_next/static|_next/image|favicon|seed|uploads).*)",
    },
  ],
};
