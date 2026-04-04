import type { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  return ((globalThis as Record<string, unknown>).__io as SocketIOServer) || null;
}

let warnedNoIO = false;

export function notifyUser(userId: string) {
  const io = getIO();
  if (!io) {
    if (!warnedNoIO) {
      console.warn("[socket] getIO() returned null — real-time notifications disabled");
      warnedNoIO = true;
    }
    return;
  }
  io.to(`user:${userId}`).emit("notifications:update");
}
