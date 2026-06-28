// Next.js boot hook. @sentry/nextjs uses this to wire its server-side
// SDK for both the Node runtime (API routes, server components) and
// the Edge runtime (middleware).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Re-export Sentry's request-error hook so it gets called on uncaught
// errors thrown from API routes / server components. The export was
// `onRequestError` in older SDKs and is `captureRequestError` in v10+;
// Next.js looks for the export named `onRequestError` so we alias.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
