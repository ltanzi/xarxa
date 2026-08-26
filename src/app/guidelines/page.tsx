import { getTranslations } from "@/i18n/server";

// One page serving onboarding, trust, and safety at once: the platform
// connects strangers, and until now nothing anywhere set expectations.
// Linked from the post form and the About page.
export default async function GuidelinesPage() {
  const { t } = await getTranslations();
  const norms = ["g1", "g2", "g3", "g4", "g5"] as const;

  return (
    <div className="pt-14">
      <section className="pt-16 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-10">
            {t("guidelines.title")}
          </h1>
          <p className="text-base leading-relaxed text-fg mb-12">
            {t("guidelines.intro")}
          </p>
          <ol className="space-y-6">
            {norms.map((key, i) => (
              <li key={key} className="flex gap-5">
                <span className="font-mono text-xs text-muted pt-1 shrink-0">
                  0{i + 1}
                </span>
                <span className="text-base leading-relaxed">{t(`guidelines.${key}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-16 pt-8 border-t border-fg/10">
            <p className="text-sm text-muted leading-relaxed">{t("guidelines.safety")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
