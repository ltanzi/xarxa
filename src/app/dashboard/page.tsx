import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ConnectionActions } from "./ConnectionActions";
import { getTranslations } from "@/i18n/server";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { t } = await getTranslations();

  const myPosts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { connections: { include: { requester: { select: { id: true, name: true, surname: true, profilePhoto: true } } } } },
  });

  const sentConnections = await prisma.connection.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: { include: { author: { select: { id: true, name: true, profilePhoto: true } } } },
    },
  });

  // Collect IDs of newly accepted connections before marking them seen
  const newlyAccepted = new Set(
    sentConnections
      .filter((c) => c.status === "ACCEPTED" && !c.seenByRequester)
      .map((c) => c.id)
  );

  // Mark newly accepted connections as seen
  await prisma.connection.updateMany({
    where: { requesterId: session.user.id, status: "ACCEPTED", seenByRequester: false },
    data: { seenByRequester: true },
  });

  const incomingConnections = myPosts.flatMap((post) =>
    post.connections
      .filter((c) => c.status === "PENDING" || c.status === "ACCEPTED")
      .map((c) => ({ ...c, post }))
  );

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-16">{t("dashboard.title")}</h1>

      <section className="mb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">{t("dashboard.incoming")}</p>
        {incomingConnections.length === 0 ? (
          <p className="text-sm text-muted">{t("dashboard.noIncoming")}</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {incomingConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm">{conn.requester.name}</p>
                  <p className="text-xs text-muted">{conn.post.title}</p>
                </div>
                {conn.status === "PENDING" ? (
                  <ConnectionActions connectionId={conn.id} />
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      {t(`dashboard.${conn.status.toLowerCase()}`)}
                    </span>
                    {conn.conversationId && (
                      <Link href={`/chat/${conn.conversationId}`} className="text-xs underline underline-offset-4 hover:no-underline">
                        {t("nav.chat")}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">{t("dashboard.sent")}</p>
        {sentConnections.length === 0 ? (
          <p className="text-sm text-muted">{t("dashboard.noSent")}</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {sentConnections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm">{conn.post.title}</p>
                  <p className="text-xs text-muted">{conn.post.author.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-[11px] uppercase tracking-wider ${newlyAccepted.has(conn.id) ? "text-fg font-bold" : "text-muted"}`}>
                    {t(`dashboard.${conn.status.toLowerCase()}`)}
                  </span>
                  {conn.status === "ACCEPTED" && conn.conversationId && (
                    <Link href={`/chat/${conn.conversationId}`} className="text-xs underline underline-offset-4 hover:no-underline">
                      {t("nav.chat")}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">{t("dashboard.myPosts")}</p>
        {myPosts.length === 0 ? (
          <p className="text-sm text-muted">{t("dashboard.noPosts")}</p>
        ) : (
          <div className="divide-y divide-fg/10">
            {myPosts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`} className="block py-4 hover:opacity-60 transition-opacity">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    {t(`posts.${post.type.toLowerCase()}`)}
                  </span>
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
