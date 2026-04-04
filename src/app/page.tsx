import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "@/i18n/server";

export default async function HomePage() {
  const { t } = await getTranslations();

  return (
    <div className="pt-14">
      <section className="pt-16 pb-32 sm:pt-20 sm:pb-44 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Image
            src="/hands.png"
            alt=""
            width={280}
            height={210}
            className="mx-auto mb-10 opacity-40 mix-blend-multiply"
          />
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-center">
            {t("landing.heroBefore")} <span className="italic">{t("landing.heroEmphasis")}</span>{t("landing.heroAfter") ? ` ${t("landing.heroAfter")}` : ""}
          </h1>
          <p className="mt-8 text-muted text-base text-center sm:whitespace-nowrap">
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
  );
}
