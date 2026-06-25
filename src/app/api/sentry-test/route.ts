// Throwaway smoke endpoint — call once to confirm Sentry captures
// server-side errors. Delete after the first issue lands in Sentry.

import * as Sentry from "@sentry/nextjs";

// Force runtime evaluation; otherwise Next.js tries to prerender this
// at build time, the throw fires there, and the entire build fails.
export const dynamic = "force-dynamic";

export async function GET() {
  const err = new Error("xarxa sentry smoke — delete this route");
  // Capture explicitly + flush before throwing — belt-and-suspenders
  // against any auto-capture wiring issue.
  Sentry.captureException(err);
  await Sentry.flush(2000);
  throw err;
}
