import Link from "next/link";
import { getTranslations } from "@/i18n/server";

export default async function AboutPage() {
  const { t } = await getTranslations();

  return (
    <div className="pt-14">
      <section className="pt-16 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-10">
            {t("about.title")}
          </h1>
          <p className="text-base leading-relaxed text-fg">
            {t("about.description")}
          </p>
          <p className="mt-6">
            <Link href="/guidelines" className="text-sm underline underline-offset-4 hover:no-underline">
              {t("guidelines.link")}
            </Link>
          </p>
          <div className="mt-16 pt-8 border-t border-fg/10">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
              {t("about.creditsLabel")}
            </p>
            <a
              href="https://www.instagram.com/ithangibla/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-fg hover:underline underline-offset-4"
            >
              ithangibla
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
