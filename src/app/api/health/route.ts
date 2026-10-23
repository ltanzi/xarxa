import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
// schema: proves this build's Prisma client matches the database — see
// schemaMatches below.
export const dynamic = "force-dynamic";

// Reads one row from every model with the client's default select, which
// names every column this build expects. If the code is older or newer
// than the database, Postgres rejects the query. On 2026-10-23 a reboot
// started a 26 August image against a migrated database: SELECT 1 passed,
// the health check stayed green, and /board failed on a column
// (Post.category) that no longer existed. This check would have returned
// 503, so `up --wait` stops a deploy like that before `latest` moves.
//
// It only catches the dangerous direction, which is the point. A new
// column the running code doesn't know about is harmless and passes.
//
// Prisma.ModelName lists every model, so a new model is covered without
// editing this file. Each check is a LIMIT 1, run one after another rather
// than all at once, so it never takes more than one pool connection.
async function schemaMatches(): Promise<boolean> {
  const delegates = prisma as unknown as Record<
    string,
    { findFirst: () => Promise<unknown> }
  >;
  for (const model of Object.values(Prisma.ModelName)) {
    const key = model.charAt(0).toLowerCase() + model.slice(1);
    try {
      await delegates[key].findFirst();
    } catch (err) {
      console.error(`[health] schema check failed on ${model}:`, err);
      return false;
    }
  }
  return true;
}

export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (err) {
    console.error("[health] db check failed:", err);
  }

  // Skipped when the DB is down: every model would fail for the same
  // reason, and `db: false` already says so.
  const schema = db && (await schemaMatches());
  const socket = getIO() !== null;

  return NextResponse.json(
    { ok: db && schema && socket, db, schema, socket },
    { status: db && schema ? 200 : 503 }
  );
}
