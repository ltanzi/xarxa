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
            <div
              className="mx-auto mb-10 w-[280px] h-[210px] overflow-hidden"
              data-snake-obstacle
            >
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
              data-snake-obstacle
            >
              {t("landing.heroBefore")}<br /><span className="italic">{t("landing.heroEmphasis")}</span>{t("landing.heroAfter") ? ` ${t("landing.heroAfter")}` : ""}
            </h1>
            <p
              className="mt-14 text-muted text-base text-center sm:whitespace-nowrap"
              data-snake-obstacle
            >
              {t("landing.subtitle")}
            </p>
            <div className="mt-10 flex justify-center">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/board/new?type=REQUEST"
                  className="px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider text-center hover:bg-fg hover:text-bg transition-colors"
                  data-snake-obstacle
                >
                  {t("landing.askHelp")}
                </Link>
                <Link
                  href="/board/new?type=OFFER"
                  className="px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider text-center hover:bg-fg hover:text-bg transition-colors"
                  data-snake-obstacle
                >
                  {t("landing.offerHelp")}
                </Link>
                <Link
                  href="/board"
                  className="col-span-2 px-5 py-2.5 bg-fg text-bg text-sm font-mono uppercase tracking-wider text-center hover:opacity-80 transition-opacity"
                  data-snake-obstacle
                >
                  {t("landing.browseBoard")}
                </Link>
              </div>
            </div>
            <div className="mt-16 flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
              <p data-snake-obstacle>{t("landing.how1")}</p>
              <p data-snake-obstacle>{t("landing.how2")}</p>
              <p data-snake-obstacle>{t("landing.how3")}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
