// Sentry — Node SDK for the Next.js app server. Loaded via
// instrumentation.ts on cold start. Captures unhandled exceptions in
// API routes and server components.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
