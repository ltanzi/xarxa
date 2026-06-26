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
// errors thrown from API routes / server components.
export { onRequestError } from "@sentry/nextjs";
