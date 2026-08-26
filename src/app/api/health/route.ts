import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

// Liveness for machines, not people. Two consumers:
//   1. The docker-compose healthcheck (wget from inside the container) —
//      gates deploys via `up --wait` and lets Docker flag a wedged app.
//   2. An UptimeRobot keyword monitor on "socket":true — catches the
//      "HTTP is green but the realtime layer is dead" failure mode that
//      a plain / check can't see (it happened: the chat relay was broken
//      for weeks while / returned 200).
// db: proves Postgres answers a trivial query. socket: proves the
// Socket.io server object exists in this process (it's attached by
// server.ts at boot; false means the custom server didn't wire it).
export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (err) {
    console.error("[health] db check failed:", err);
  }

  const socket = getIO() !== null;

  return NextResponse.json(
    { ok: db && socket, db, socket },
    { status: db ? 200 : 503 }
  );
}
