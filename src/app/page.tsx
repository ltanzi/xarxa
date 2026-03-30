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

  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="px-6 lg:px-8 pt-16 pb-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-4">
            Volunteer service exchange
          </p>
          <h1 className="font-headline text-[clamp(3rem,10vw,7rem)]">
            A space to<br />exchange<br />services,<br />freely.
          </h1>
          <div className="mt-6 max-w-sm">
            <p className="text-muted leading-relaxed">
              Individuals and collectives offering and requesting volunteer help. No money involved.
            </p>
          </div>
          <div className="mt-5 flex gap-5 items-center text-[11px] uppercase tracking-wider">
            <Link href="/board" className="underline underline-offset-4 hover:no-underline">
              Browse
            </Link>
            <Link href="/auth/register" className="text-muted hover:text-fg transition-colors">
              Join
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="border-t border-fg/10" />
      </div>

      {/* Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-10 px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Recent posts
            </p>
            <div>
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="group block border-t border-fg/8 py-3 hover:opacity-50 transition-opacity"
                >
                  <div className="grid grid-cols-12 gap-3 items-baseline">
                    <span className="col-span-2 lg:col-span-1 text-[10px] uppercase tracking-wider text-muted">
                      {post.type}
                    </span>
                    <span className="col-span-10 sm:col-span-6 lg:col-span-7 font-headline text-lg">
                      {post.title}
                    </span>
                    <span className="hidden sm:block col-span-2 text-[10px] uppercase tracking-wider text-muted text-right">
                      {post.category.replace("_", " ")}
                    </span>
                    <span className="hidden lg:block col-span-2 text-[11px] text-muted text-right">
                      {post.author.name}
                    </span>
                  </div>
                </Link>
              ))}
              <div className="border-t border-fg/8" />
            </div>
            <div className="mt-6">
              <Link href="/board" className="text-[11px] uppercase tracking-wider underline underline-offset-4 hover:no-underline">
                See all
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
