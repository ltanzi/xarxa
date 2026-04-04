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
  if (!secret) return null;

  const tokenCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("authjs.session-token=") || c.startsWith("__Secure-authjs.session-token="));

  if (!tokenCookie) return null;
  const token = tokenCookie.split("=").slice(1).join("=");

  try {
    const decoded = await decode({ token, secret, salt: tokenCookie.startsWith("__Secure-") ? "__Secure-authjs.session-token" : "authjs.session-token" });
    return (decoded?.id as string) || null;
  } catch {
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
    // Join personal notification room
    socket.join(`user:${socket.data.userId}`);

    socket.on("join-conversation", async (conversationId: string) => {
      try {
        const { prisma } = await import("./src/lib/prisma");
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            participants: { some: { id: socket.data.userId } },
          },
          select: { id: true },
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error("[socket] join-conversation error:", err);
      }
    });

    socket.on("send-message", async (data: { conversationId: string; message: unknown }) => {
      socket.to(`conversation:${data.conversationId}`).emit("new-message", data.message);

      // Notify other participants to refresh their notification counts
      try {
        const { prisma } = await import("./src/lib/prisma");
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          select: { participants: { select: { id: true } } },
        });
        if (conversation) {
          for (const p of conversation.participants) {
            if (p.id !== socket.data.userId) {
              io.to(`user:${p.id}`).emit("notifications:update");
            }
          }
        }
      } catch {
        // non-critical, don't break message flow
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
