// Throwaway smoke endpoint — call once to confirm Sentry captures
// server-side errors. Delete after the first issue lands in Sentry.
import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("xarxa sentry smoke — delete this route");
  return NextResponse.json({ unreachable: true });
}
