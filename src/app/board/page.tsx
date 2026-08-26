import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { getTranslations } from "@/i18n/server";

const PAGE_SIZE = 20;

interface BoardPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    urgency?: string;
    mode?: string;
    location?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const { t } = await getTranslations();
  const params = await searchParams;
  const where: Prisma.PostWhereInput = { closed: false };
  // Guard everything that reaches the Prisma query: ?page=abc parses to
  // NaN (Prisma throws on skip: NaN → error page), and an arbitrary
  // ?category=FOO string fails enum validation the same way. Any crawler
  // could 500 the board at will.
  const parsedPage = parseInt(params.page || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const CATEGORIES = ["LEGAL", "EDUCATION", "HEALTH", "TECHNOLOGY", "MANUAL_WORK", "TRANSLATION", "OTHER"];
  const URGENCIES = ["LOW", "NORMAL", "URGENT"];

  if (params.type === "OFFER" || params.type === "REQUEST") {
    where.type = params.type;
  }
  if (params.category && CATEGORIES.includes(params.category)) {
    where.category = params.category as Prisma.EnumCategoryFilter;
  }
  if (params.urgency && URGENCIES.includes(params.urgency)) {
    where.urgency = params.urgency as Prisma.EnumUrgencyFilter;
  }
  if (params.mode === "REMOTE") {
    where.isRemote = true;
  } else if (params.mode === "IN_PERSON") {
    where.isRemote = false;
  }
  if (params.location) {
    where.location = { contains: params.location, mode: "insensitive" };
  }
  if (params.search) {
    const terms = params.search.split(",").filter(Boolean);
    if (terms.length > 0) {
      where.OR = terms.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { tags: { has: term } },
        { author: { name: { contains: term, mode: "insensitive" } } },
        { author: { surname: { contains: term, mode: "insensitive" } } },
      ]);
    }
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        author: { select: { id: true, name: true, surname: true, type: true, profilePhoto: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (params.type) sp.set("type", params.type);
    if (params.category) sp.set("category", params.category);
    if (params.urgency) sp.set("urgency", params.urgency);
    if (params.mode) sp.set("mode", params.mode);
    if (params.location) sp.set("location", params.location);
    if (params.search) sp.set("search", params.search);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/board${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 pt-24 pb-16">
      <div className="flex items-baseline justify-between mb-12">
        <h1 className="text-3xl font-light">{t("board.title")}</h1>
        <Link href="/board/new" className="text-sm underline underline-offset-4 hover:no-underline">
          {t("posts.newPost")}
        </Link>
      </div>
      <PostFilters />
      {posts.length === 0 ? (
        // Two different empty states: "your filters excluded everything"
        // (offer the way out) vs "the board is genuinely empty" (invite
        // the first post). One flat string served both before.
        params.type || params.category || params.urgency || params.mode || params.search || params.location ? (
          <p className="text-muted text-sm py-20">
            {t("board.emptyFiltered")}{" "}
            <Link href="/board" className="text-fg underline underline-offset-4 hover:no-underline">
              {t("board.clearFilters")}
            </Link>
          </p>
        ) : (
          <p className="text-muted text-sm py-20">
            {t("board.emptyBoard")}{" "}
            <Link href="/board/new?type=REQUEST" className="text-fg underline underline-offset-4 hover:no-underline">
              {t("landing.askHelp")}
            </Link>
            {" / "}
            <Link href="/board/new?type=OFFER" className="text-fg underline underline-offset-4 hover:no-underline">
              {t("landing.offerHelp")}
            </Link>
          </p>
        )
      ) : (
        <>
          <div className="border-t border-fg/10">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 text-sm font-mono">
              {page > 1 && (
                <Link
                  href={pageUrl(page - 1)}
                  aria-label={t("posts.prevPage")}
                  className="underline underline-offset-4 hover:no-underline px-2 py-1"
                >
                  &larr;
                </Link>
              )}
              <span className="text-muted">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={pageUrl(page + 1)}
                  aria-label={t("posts.nextPage")}
                  className="underline underline-offset-4 hover:no-underline px-2 py-1"
                >
                  &rarr;
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
