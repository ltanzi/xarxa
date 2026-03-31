import Link from "next/link";
import { prisma } from "@/lib/prisma";

const spotClass: Record<string, string> = {
  LEGAL: "spot-legal",
  EDUCATION: "spot-education",
  HEALTH: "spot-health",
  TECHNOLOGY: "spot-technology",
  MANUAL_WORK: "spot-manual_work",
  TRANSLATION: "spot-translation",
  OTHER: "spot-other",
};

export default async function HomePage() {
  const featuredPosts = await prisma.post.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="py-28 sm:py-40 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.9]">
            A space for<br />mutual help <span className="doodle-star" />
          </h1>
          <p className="mt-8 text-muted max-w-md leading-relaxed">
            Individuals and collectives offering and requesting volunteer help. No money involved.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/board/new?type=REQUEST"
              className="font-display text-sm px-5 py-2.5 bg-fg text-bg hover:opacity-80 transition-opacity"
            >
              Ask help
            </Link>
            <Link
              href="/board/new?type=OFFER"
              className="font-display text-sm px-5 py-2.5 border border-fg/20 text-fg hover:border-fg transition-colors"
            >
              Offer help
            </Link>
            <span className="mx-1 text-fg/15">|</span>
            <Link
              href="/board"
              className="text-sm text-muted hover:text-fg transition-colors underline underline-offset-4 hover:no-underline"
            >
              Browse the board <span className="doodle-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-fg/10" />
      </div>

      {/* Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-widest text-muted mb-10">
              <span className="doodle-star mr-2" /> Recent posts
            </p>
            <div className="divide-y divide-fg/10">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="group py-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 hover:opacity-60 transition-opacity"
                >
                  <span className={`text-[11px] uppercase tracking-wider shrink-0 sm:w-24 font-bold ${spotClass[post.category] || "text-muted"}`}>
                    {post.type}
                  </span>
                  <span className="font-display text-xl sm:text-2xl flex-1 normal-case tracking-normal">
                    {post.title}
                  </span>
                  <span className={`text-[11px] uppercase tracking-wider shrink-0 ${spotClass[post.category] || "text-muted"}`}>
                    {post.category.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted shrink-0 hidden sm:block">
                    {post.author.name}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/board" className="text-sm underline underline-offset-4 hover:no-underline">
                See all <span className="doodle-arrow" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
