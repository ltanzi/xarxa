import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming Requests</h2>
        {incomingConnections.length === 0 ? (
          <p className="text-gray-500 text-sm">No incoming connection requests.</p>
        ) : (
          <div className="space-y-3">
            {incomingConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between bg-white border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={conn.requester.name} src={conn.requester.profilePhoto} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{conn.requester.name}</p>
                    <p className="text-xs text-gray-500">interested in: {conn.post.title}</p>
                  </div>
                </div>
                <ConnectionActions connectionId={conn.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Requests</h2>
        {sentConnections.length === 0 ? (
          <p className="text-gray-500 text-sm">No sent connection requests.</p>
        ) : (
          <div className="space-y-3">
            {sentConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between bg-white border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={conn.post.author.name} src={conn.post.author.profilePhoto} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{conn.post.title}</p>
                    <p className="text-xs text-gray-500">by {conn.post.author.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={conn.status === "PENDING" ? "pending" : conn.status === "ACCEPTED" ? "accepted" : "rejected"}>
                    {conn.status}
                  </Badge>
                  {conn.status === "ACCEPTED" && conn.conversationId && (
                    <Link href={`/chat/${conn.conversationId}`} className="text-sm text-indigo-600 hover:underline">
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Posts</h2>
        {myPosts.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven&apos;t created any posts yet.</p>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`} className="block bg-white border rounded-lg p-4 hover:shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={post.type === "OFFER" ? "offer" : "request"}>{post.type}</Badge>
                  <Badge>{post.category.replace("_", " ")}</Badge>
                </div>
                <h3 className="font-medium text-gray-900">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{post.connections.length} connection(s)</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
