import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

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
      <section className="py-32 sm:py-44 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Image
            src="/hands.png"
            alt=""
            width={280}
            height={210}
            className="mx-auto mb-10 opacity-40 mix-blend-multiply"
          />
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-center">
            A space for <span className="italic">mutual</span> help
          </h1>
          <p className="mt-8 text-muted text-base whitespace-nowrap text-center">
            Individuals and collectives offering and requesting volunteer help. No money involved.
          </p>
          <div className="mt-10 flex justify-center items-center gap-4">
            <Link
              href="/board/new?type=REQUEST"
              className="px-5 py-2.5 bg-fg text-bg text-sm font-mono uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Ask help
            </Link>
            <Link
              href="/board/new?type=OFFER"
              className="px-5 py-2.5 border border-fg/20 text-fg text-sm font-mono uppercase tracking-wider hover:border-fg/50 transition-colors"
            >
              Offer help
            </Link>
            <span className="mx-2 text-fg/15">|</span>
            <Link
              href="/board"
              className="text-sm text-muted hover:text-fg transition-colors underline underline-offset-4 hover:no-underline"
            >
              Browse the board
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
        <section className="py-20 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-widest text-muted mb-12">
              Recent posts
            </p>
            <div className="grid gap-0 divide-y divide-fg/10">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="group py-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 hover:opacity-60 transition-opacity"
                >
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted shrink-0 sm:w-28">
                    {post.type}
                  </span>
                  <span className="text-lg sm:text-xl font-light flex-1">
                    {post.title}
                  </span>
                  <span className="font-mono text-[11px] text-muted shrink-0">
                    {post.category.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted shrink-0 hidden sm:block">
                    {post.author.name}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-12">
              <Link href="/board" className="text-sm underline underline-offset-4 hover:no-underline">
                See all
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
