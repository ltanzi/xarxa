import Link from "next/link";
import { getTranslations } from "@/i18n/server";
import { SnakeGame } from "@/components/SnakeGame";

export default async function HomePage() {
  const { t } = await getTranslations();

  return (
    <>
      <SnakeGame />
      <div className="pt-14">
        <section className="pt-6 pb-32 sm:pt-8 sm:pb-44 px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-10 w-[280px] h-[210px] overflow-hidden">
              <video
                src="/animation.mp4"
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
                className="w-full h-full object-cover scale-110 opacity-60 mix-blend-darken"
              />
            </div>
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.3] tracking-tight text-center"
            >
              {t("landing.heroBefore")}<br /><span className="italic">{t("landing.heroEmphasis")}</span>{t("landing.heroAfter") ? ` ${t("landing.heroAfter")}` : ""}
            </h1>
            <p
              className="mt-14 text-muted text-base text-center sm:whitespace-nowrap"
            >
              {t("landing.subtitle")}
            </p>
            <div className="mt-10 flex justify-center">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/board/new?type=REQUEST"
                  className="px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider text-center hover:bg-fg hover:text-bg transition-colors"
                >
                  {t("landing.askHelp")}
                </Link>
                <Link
                  href="/board/new?type=OFFER"
                  className="px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider text-center hover:bg-fg hover:text-bg transition-colors"
                >
                  {t("landing.offerHelp")}
                </Link>
                <Link
                  href="/board"
                  className="col-span-2 px-5 py-2.5 bg-fg text-bg text-sm font-mono uppercase tracking-wider text-center hover:opacity-80 transition-opacity"
                >
                  {t("landing.browseBoard")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mirrors the snake's hint: same line via --snake-hint-bottom, which
          SnakeGame publishes on resize, and the same gutter via the nav's own
          container, so the right edge lands where the wordmark's left edge
          does. The fallback covers the cases where the game never starts —
          mobile and reduced motion — where nothing sets the variable.
          z-10 puts it over the canvas (-z-10) and under the nav (z-50). */}
      <div
        className="pointer-events-none fixed inset-x-0 z-10"
        style={{ bottom: "var(--snake-hint-bottom, 78px)" }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex justify-end">
          {/* The padding is inside the <a>, so the whole oval is the target,
              not just the words. rounded-full matches the search pills — the
              one rounded shape the design already uses. */}
          <Link
            href="/how-it-works"
            className="pointer-events-auto rounded-full border border-fg/25 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:border-fg hover:text-fg"
          >
            {t("howItWorks.link")}
          </Link>
        </div>
      </div>
    </>
  );
}
