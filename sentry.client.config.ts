// Sentry — browser SDK. Loaded automatically by @sentry/nextjs on every
// client page. Captures unhandled errors, unhandled promise rejections,
// and slow transactions for the configured sample rate.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Tag every event with the build's commit SHA so we can correlate
  // issues to deploys.
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  environment: process.env.NODE_ENV,
  // Errors: capture all (volume is low at our scale).
  // Performance traces: 10% — enough for a profile without blowing the
  // free-tier event budget (5k/month).
  tracesSampleRate: 0.1,
  // Disable session replay; we don't need it and it adds bundle weight.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});
