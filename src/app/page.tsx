import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const featuredPosts = await prisma.post.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  const offerCount = await prisma.post.count({ where: { type: "OFFER" } });
  const requestCount = await prisma.post.count({ where: { type: "REQUEST" } });

  return (
    <div className="pt-16">
      {/* Hero — full viewport, asymmetric */}
      <section className="min-h-[85vh] flex flex-col justify-end px-6 lg:px-10 pb-16 relative">
        <div className="mx-auto max-w-[1400px] w-full">
          <p className="font-label text-muted mb-6 animate-in animate-in-1">
            Volunteer service exchange
          </p>
          <h1 className="font-display text-[clamp(3rem,8vw,8rem)] leading-[0.95] font-300 tracking-tight animate-in animate-in-2">
            A space to<br />
            <em className="text-accent">exchange</em> services,<br />
            freely.
          </h1>
          <div className="mt-12 flex items-end justify-between animate-in animate-in-3">
            <div className="flex gap-8 items-center">
              <Link
                href="/board"
                className="font-label text-fg hover-line accent-line"
              >
                Browse the board
              </Link>
              <Link
                href="/auth/register"
                className="font-label text-muted hover:text-fg transition-colors duration-300"
              >
                Join
              </Link>
            </div>
            <div className="hidden sm:flex gap-12 font-label text-muted">
              <div>
                <span className="font-display text-4xl font-300 text-fg block">{offerCount}</span>
                offers
              </div>
              <div>
                <span className="font-display text-4xl font-300 text-fg block">{requestCount}</span>
                requests
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="border-t border-fg/8" />
      </div>

      {/* Recent posts — editorial list */}
      {featuredPosts.length > 0 && (
        <section className="py-24 px-6 lg:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex items-baseline justify-between mb-16">
              <p className="font-label text-muted">Recent</p>
              <Link href="/board" className="font-label text-muted hover:text-fg transition-colors duration-300">
                View all
              </Link>
            </div>
            <div>
              {featuredPosts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className={`group block border-t border-fg/8 py-7 animate-in animate-in-${Math.min(i + 1, 5)}`}
                >
                  <div className="grid grid-cols-12 gap-4 items-baseline">
                    <span className="col-span-2 lg:col-span-1 font-label text-muted">
                      {post.type}
                    </span>
                    <span className="col-span-10 sm:col-span-6 lg:col-span-7 font-display text-2xl sm:text-3xl font-300 group-hover:text-accent transition-colors duration-300">
                      {post.title}
                    </span>
                    <span className="hidden sm:block col-span-2 font-label text-muted text-right">
                      {post.category.replace("_", " ")}
                    </span>
                    <span className="hidden lg:block col-span-2 text-sm text-muted text-right">
                      {post.author.name}
                    </span>
                  </div>
                </Link>
              ))}
              <div className="border-t border-fg/8" />
            </div>
          </div>
        </section>
      )}

      {/* Footer area */}
      <section className="py-20 px-6 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-display text-xl sm:text-2xl font-300 text-muted max-w-xl leading-relaxed">
            Individuals and collectives offering and requesting help.
            No money, just community.
          </p>
        </div>
      </section>
    </div>
  );
}
