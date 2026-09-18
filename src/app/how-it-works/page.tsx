import Link from "next/link";
import { getTranslations } from "@/i18n/server";
import { PostCard } from "@/components/posts/PostCard";
import type { PostWithAuthor } from "@/types";

/**
 * The sample post is built from locale strings and rendered through the real
 * PostCard in `example` mode, rather than screenshotted.
 *
 * Screenshots were the obvious approach and the wrong one here: they would
 * need re-shooting after every board change (the filters alone were rebuilt
 * twice in a week), they would need an en/es/ca set each, and nothing would
 * tell anyone when one went stale. Rendering the component means the guide
 * cannot disagree with the board, and it translates itself.
 */
function sample(t: (k: string) => string): PostWithAuthor {
  const now = new Date();
  return {
    id: "example",
    title: t("howItWorks.samplePostTitle"),
    type: "REQUEST",
    categories: ["MOVING", "MUSIC"],
    categoryOther: null,
    description: t("howItWorks.samplePostBody"),
    urgency: "NORMAL",
    availability: null,
    gift: t("howItWorks.sampleGift"),
    location: "Barcelona, Catalonia, Spain",
    neighborhood: "el Poble-sec",
    isRemote: false,
    tags: [t("howItWorks.sampleTag1"), t("howItWorks.sampleTag2"), t("howItWorks.sampleTag3")],
    closed: false,
    expiryNudgedAt: null,
    createdAt: now,
    updatedAt: now,
    authorId: "example",
    author: {
      id: "example",
      name: t("howItWorks.sampleAuthor"),
      surname: null,
      type: "PRIVATE",
      profilePhoto: null,
    },
  };
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-fg/10 pt-8">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[11px] text-muted tabular-nums shrink-0">
          {String(n).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-light mb-3">{title}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function HowItWorksPage() {
  const { t } = await getTranslations();

  return (
    <div className="pt-14">
      <div className="mx-auto max-w-2xl px-6 lg:px-8 pt-16 pb-24">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-6">
          {t("howItWorks.title")}
        </h1>
        <p className="text-base leading-relaxed text-fg mb-16">{t("howItWorks.intro")}</p>

        <div className="flex flex-col gap-12">
          <Step n={1} title={t("howItWorks.step1Title")}>
            <p className="text-sm text-muted leading-relaxed">{t("howItWorks.step1Body")}</p>
          </Step>

          <Step n={2} title={t("howItWorks.step2Title")}>
            <p className="text-sm text-muted leading-relaxed">{t("howItWorks.step2Body")}</p>
            {/* The board's own card, inert. Not a picture of one. */}
            <div className="mt-6 border border-fg/15 px-5 pb-1 pt-0">
              <PostCard post={sample(t)} example />
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              {t("howItWorks.step2Caption")}
            </p>
          </Step>

          <Step n={3} title={t("howItWorks.step3Title")}>
            <p className="text-sm text-muted leading-relaxed">{t("howItWorks.step3Body")}</p>
          </Step>

          <Step n={4} title={t("howItWorks.step4Title")}>
            <p className="text-sm text-muted leading-relaxed">{t("howItWorks.step4Body")}</p>
          </Step>

          <Step n={5} title={t("howItWorks.step5Title")}>
            <p className="text-sm text-muted leading-relaxed">{t("howItWorks.step5Body")}</p>
          </Step>
        </div>

        <section className="mt-16 border-t border-fg/10 pt-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-5">
            {t("howItWorks.extrasTitle")}
          </p>
          <ul className="flex flex-col gap-3 text-sm text-muted leading-relaxed">
            {["extra1", "extra2", "extra3", "extra4"].map((k) => (
              <li key={k} className="flex gap-3">
                <span aria-hidden="true" className="text-fg/30 shrink-0">—</span>
                <span>{t(`howItWorks.${k}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12">
          <Link
            href="/guidelines"
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            {t("howItWorks.guidelinesCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
