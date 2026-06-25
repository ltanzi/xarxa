// Throwaway smoke endpoint — call once to confirm Sentry captures
// server-side errors. Delete after the first issue lands in Sentry.

// Force runtime evaluation; otherwise Next.js tries to prerender this
// at build time, the throw fires there, and the entire build fails.
export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("xarxa sentry smoke — delete this route");
}
