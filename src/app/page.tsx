import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/posts/PostCard";

export default async function HomePage() {
  const featuredPosts = await prisma.post.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        {/* Floating doodles */}
        <svg className="absolute top-10 left-10 w-16 h-16 text-coral/20 animate-float" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="8 6" />
        </svg>
        <svg className="absolute top-20 right-20 w-20 h-20 text-violet/20 animate-float-slow" viewBox="0 0 100 100" fill="none">
          <path d="M20 80 Q50 10 80 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M10 50 Q50 90 90 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-20 left-1/4 w-12 h-12 text-lime/30 animate-wiggle" viewBox="0 0 100 100" fill="none">
          <rect x="15" y="15" width="70" height="70" rx="15" stroke="currentColor" strokeWidth="3" strokeDasharray="10 5" transform="rotate(12 50 50)" />
        </svg>
        <svg className="absolute bottom-10 right-1/3 w-14 h-14 text-sunflower/30 animate-float" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L61 40 L97 40 L68 62 L79 97 L50 75 L21 97 L32 62 L3 40 L39 40 Z" opacity="0.4" />
        </svg>
        <svg className="absolute top-1/2 left-[8%] w-10 h-10 text-sky/25 animate-float-slow" viewBox="0 0 100 100" fill="none">
          <path d="M50 10 C80 10 90 40 70 60 C90 80 60 100 50 80 C40 100 10 80 30 60 C10 40 20 10 50 10Z" stroke="currentColor" strokeWidth="3" />
        </svg>
        <svg className="absolute top-32 right-[12%] w-8 h-8 text-peach/30 animate-wiggle" viewBox="0 0 100 100" fill="none">
          <path d="M10 50 L50 10 L90 50 L50 90Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        </svg>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="font-handwritten text-2xl text-coral mb-4">Welcome to</p>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900">
            <span className="hand-underline">Exchange</span> services,{" "}
            <br className="hidden sm:block" />
            build <span className="hand-underline-violet">community</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A platform where individuals and collectives offer and request
            volunteer services for free. No money, just help.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/board">
              <span className="inline-flex items-center rounded-full bg-coral px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-coral/90 hover:-translate-y-0.5 transition-all duration-200">
                Browse the Board
              </span>
            </Link>
            <Link href="/auth/register">
              <span className="inline-flex items-center rounded-full border-2 border-dashed border-violet px-8 py-3.5 text-sm font-bold text-violet hover:bg-violet/5 hover:-translate-y-0.5 transition-all duration-200">
                Join Now
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-handwritten text-3xl text-violet mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-lime/20 flex items-center justify-center mx-auto text-2xl">
                <span className="font-handwritten text-3xl text-green-700">1</span>
              </div>
              <h3 className="font-bold text-gray-900">Post a service</h3>
              <p className="text-sm text-gray-500">Offer your skills or request help from the community</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-violet/20 flex items-center justify-center mx-auto">
                <span className="font-handwritten text-3xl text-violet">2</span>
              </div>
              <h3 className="font-bold text-gray-900">Connect</h3>
              <p className="text-sm text-gray-500">Express interest and get matched with someone who can help</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center mx-auto">
                <span className="font-handwritten text-3xl text-coral">3</span>
              </div>
              <h3 className="font-bold text-gray-900">Chat & collaborate</h3>
              <p className="text-sm text-gray-500">A private chat opens automatically so you can coordinate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured posts */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Posts</h2>
            <span className="font-handwritten text-xl text-lime">fresh from the community</span>
          </div>
          {featuredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-handwritten text-2xl text-gray-400">No posts yet...</p>
              <p className="text-gray-500 mt-2">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
