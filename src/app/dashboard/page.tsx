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
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-16">Dashboard</h1>

      <section className="mb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">Incoming</p>
        {incomingConnections.length === 0 ? (
          <p className="text-sm text-muted">No pending requests.</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {incomingConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm">{conn.requester.name}</p>
                  <p className="text-xs text-muted">{conn.post.title}</p>
                </div>
                <ConnectionActions connectionId={conn.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">Sent</p>
        {sentConnections.length === 0 ? (
          <p className="text-sm text-muted">No sent requests.</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {sentConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm">{conn.post.title}</p>
                  <p className="text-xs text-muted">{conn.post.author.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{conn.status}</span>
                  {conn.status === "ACCEPTED" && conn.conversationId && (
                    <Link href={`/chat/${conn.conversationId}`} className="text-xs underline underline-offset-4 hover:no-underline">
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">My posts</p>
        {myPosts.length === 0 ? (
          <p className="text-sm text-muted">No posts yet.</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {myPosts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`} className="block py-4 hover:opacity-60 transition-opacity">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{post.type}</span>
                  <span className="text-sm">{post.title}</span>
                  <span className="text-xs text-muted ml-auto">{post.connections.length}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
