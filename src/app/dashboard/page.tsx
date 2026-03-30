import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ConnectionActions } from "./ConnectionActions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const myPosts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { connections: { include: { requester: { select: { id: true, name: true, profilePhoto: true } } } } },
  });

  const sentConnections = await prisma.connection.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: { include: { author: { select: { id: true, name: true, profilePhoto: true } } } },
    },
  });

  const incomingConnections = myPosts.flatMap((post) =>
    post.connections
      .filter((c) => c.status === "PENDING")
      .map((c) => ({ ...c, post }))
  );

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-28 pb-20">
      <h1 className="font-display text-5xl font-300 tracking-tight mb-20 animate-in">Dashboard</h1>

      <section className="mb-20 animate-in animate-in-1">
        <p className="font-label text-muted mb-8">Incoming</p>
        {incomingConnections.length === 0 ? (
          <p className="text-sm text-muted">No pending requests.</p>
        ) : (
          <div>
            {incomingConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-5 border-t border-fg/8">
                <div>
                  <p className="text-[15px]">{conn.requester.name}</p>
                  <p className="font-label text-muted mt-1">{conn.post.title}</p>
                </div>
                <ConnectionActions connectionId={conn.id} />
              </div>
            ))}
            <div className="border-t border-fg/8" />
          </div>
        )}
      </section>

      <section className="mb-20 animate-in animate-in-2">
        <p className="font-label text-muted mb-8">Sent</p>
        {sentConnections.length === 0 ? (
          <p className="text-sm text-muted">No sent requests.</p>
        ) : (
          <div>
            {sentConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-5 border-t border-fg/8">
                <div>
                  <p className="text-[15px]">{conn.post.title}</p>
                  <p className="font-label text-muted mt-1">{conn.post.author.name}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-label text-muted">{conn.status}</span>
                  {conn.status === "ACCEPTED" && conn.conversationId && (
                    <Link href={`/chat/${conn.conversationId}`} className="font-label text-fg hover-line accent-line">
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div className="border-t border-fg/8" />
          </div>
        )}
      </section>

      <section className="animate-in animate-in-3">
        <p className="font-label text-muted mb-8">My posts</p>
        {myPosts.length === 0 ? (
          <p className="text-sm text-muted">No posts yet.</p>
        ) : (
          <div>
            {myPosts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`} className="group block py-5 border-t border-fg/8">
                <div className="flex items-baseline gap-6">
                  <span className="font-label text-muted">{post.type}</span>
                  <span className="font-display text-xl font-300 group-hover:text-accent transition-colors duration-300 flex-1">{post.title}</span>
                  <span className="font-label text-muted">{post.connections.length}</span>
                </div>
              </Link>
            ))}
            <div className="border-t border-fg/8" />
          </div>
        )}
      </section>
    </div>
  );
}
