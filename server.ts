// NOTE: server.ts is compiled by tsc in isolation (tsconfig.server.json
// includes only this file), so we can't import from ./src/lib/* here —
// those modules aren't compiled to dist/. Env validation still happens
// via Next.js's bundled src/lib/env.ts on first prisma import. A proper
// eager validation requires either widening tsconfig.server.json's
// include, or inlining the Zod schema here. Deferred.

// Sentry — Node SDK init at the very top, before any handlers can throw.
// We init here (not via instrumentation.ts) because this is a custom
// server; Next.js's automatic instrumentation hook isn't fired through
// our `next({...})` wrapper. The Edge runtime (middleware) still gets
// initialised via src/instrumentation.ts.
import * as Sentry from "@sentry/nextjs";
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { decode } from "next-auth/jwt";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function getUserIdFromCookie(cookieHeader: string | undefined): Promise<string | null> {
  if (!cookieHeader) return null;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[socket] NEXTAUTH_SECRET is not set — all socket connections will fail");
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("authjs.session-token=") || c.startsWith("__Secure-authjs.session-token="));

  if (!tokenCookie) return null;
  const token = tokenCookie.split("=").slice(1).join("=");

  try {
    const decoded = await decode({ token, secret, salt: tokenCookie.startsWith("__Secure-") ? "__Secure-authjs.session-token" : "authjs.session-token" });
    return (decoded?.id as string) || null;
  } catch (err) {
    console.error("[socket] JWT decode failed:", err);
    Sentry.captureException(err);
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  // Make io available globally for API routes to emit notifications
  (globalThis as Record<string, unknown>).__io = io;

  io.use(async (socket, next) => {
    const userId = await getUserIdFromCookie(socket.handshake.headers.cookie);
    if (!userId) {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    // Join personal notification + delivery room. This is the ONLY room
    // the socket layer manages: chat messages and notification updates
    // are both emitted into user:{id} rooms from the REST routes (see
    // src/lib/socket.ts emitToUser). There are no conversation rooms and
    // no client-driven relay — the old join-conversation handler needed
    // a prisma import that the standalone build doesn't ship, so it
    // silently failed in prod. server.ts must stay free of src/lib/*
    // imports (tsc compiles it in isolation; see tsconfig.server.json).
    socket.join(`user:${socket.data.userId}`);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
