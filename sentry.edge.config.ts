// Sentry — Edge runtime SDK (Next.js middleware). Loaded via
// instrumentation.ts. Captures errors in src/middleware.ts.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
