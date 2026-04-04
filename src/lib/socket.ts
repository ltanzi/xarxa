import type { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  return ((globalThis as Record<string, unknown>).__io as SocketIOServer) || null;
}

export function notifyUser(userId: string) {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit("notifications:update");
  }
}
