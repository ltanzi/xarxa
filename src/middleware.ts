import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

function safeUrlOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Origin-header CSRF defense for mutating /api/ requests.
  //    Blocks cross-origin POSTs from third-party sites. We require a header
  //    (Origin preferred, Referer fallback) and reject when it doesn't match
  //    our expected origin — earlier we let missing-Origin through, but
  //    modern browsers always send Origin on POST so requiring it is safe.
  //    NextAuth's [...nextauth] route is matcher-excluded; our custom
  //    /api/auth/register and /api/auth/resend-verification routes ARE
  //    covered (the matcher excludes "api/auth" but those routes pattern
  //    starts with "api/auth/" — see matcher tightening below).
  const method = request.method;
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const expectedOrigin = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).origin
      : null;

    const observedOrigin = origin
      ? origin
      : referer
      ? safeUrlOrigin(referer)
      : null;

    if (!expectedOrigin || observedOrigin !== expectedOrigin) {
      return NextResponse.json({ error: "BAD_ORIGIN" }, { status: 403 });
    }
  }

  // 2. Auth-redirect for protected paths.
  //    Auth.js v5 uses the "authjs.session-token" cookie name (not the v4
  //    "next-auth.session-token" default that getToken assumes), so we have
  //    to pass it explicitly. secureCookie=true adds the __Secure- prefix
  //    automatically on HTTPS.
  if (isProtected(pathname)) {
    const isHttps = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: isHttps ? "__Secure-authjs.session-token" : "authjs.session-token",
      secureCookie: isHttps,
      salt: isHttps ? "__Secure-authjs.session-token" : "authjs.session-token",
    });
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 3. Per-request CSP nonce + headers
  //    connect-src is scoped to our own origin's WSS (so an XSS can't
  //    exfiltrate over an attacker-chosen socket) plus Sentry's ingest
  //    endpoint (the SDK posts errors to *.ingest.sentry.io / sentry.io).
  //
  //    'unsafe-eval' is added in dev only — Next.js's React Refresh
  //    (hot-reload) runtime evaluates strings as JS. Without it, the
  //    dev bundle silently fails to hydrate and event handlers don't
  //    attach. Production builds don't need eval(), so the prod CSP
  //    stays strict.
  const nonce = btoa(crypto.randomUUID());
  const expectedOriginForCsp = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).host
    : "";
  const wssSelf = expectedOriginForCsp ? `wss://${expectedOriginForCsp}` : "";
  const evalForDev = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${evalForDev}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${wssSelf} https://*.ingest.sentry.io https://sentry.io`.trim(),
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
}

export const config = {
  // Run middleware on everything except NextAuth's *own* internal routes,
  // static assets, and uploads. Custom routes under /api/auth/ that WE
  // wrote (register, resend-verification, verify-email) must pass through
  // so CSP and Origin check apply to them.
  matcher: [
    {
      source:
        "/((?!api/auth/signin|api/auth/signout|api/auth/callback|api/auth/session|api/auth/csrf|api/auth/providers|api/auth/error|api/auth/verify-request|_next/static|_next/image|favicon|seed|uploads).*)",
    },
  ],
};
