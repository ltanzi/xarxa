import Link from "next/link";
import { getTranslations } from "@/i18n/server";
import { FeedbackForm } from "@/components/FeedbackForm";

// xarxa.help has no MX record, so this address can't receive anything yet:
// SPF/Resend authorise the domain to SEND, which is a different thing. Set
// up Cloudflare Email Routing (free — the zone is already on Cloudflare) to
// forward it, then flip EMAIL_LIVE to true so it becomes a real mailto.
const CONTACT_EMAIL = "info@xarxa.help";
const EMAIL_LIVE = false;

// The Instagram account doesn't exist yet. A live link would hand every
// visitor a 404, so until INSTAGRAM_URL holds the real profile the handle
// renders as plain text with a "soon" marker. Filling in the URL turns it
// into a link — nothing else to change.
const INSTAGRAM_HANDLE = "@xarxa.help";
const INSTAGRAM_URL: string | null = null;

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
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/how-it-works" className="text-sm underline underline-offset-4 hover:no-underline">
              {t("howItWorks.link")}
            </Link>
            <Link href="/guidelines" className="text-sm underline underline-offset-4 hover:no-underline">
              {t("guidelines.link")}
            </Link>
          </p>
          <div className="mt-16 pt-8 border-t border-fg/10">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">
              {t("about.contactLabel")}
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                {INSTAGRAM_URL ? (
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-fg hover:underline underline-offset-4"
                  >
                    {INSTAGRAM_HANDLE}
                  </a>
                ) : (
                  <span className="flex items-baseline gap-3">
                    <span className="text-base text-muted">{INSTAGRAM_HANDLE}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      {t("about.soon")}
                    </span>
                  </span>
                )}
              </li>
              <li>
                {EMAIL_LIVE ? (
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-base text-fg hover:underline underline-offset-4"
                  >
                    {CONTACT_EMAIL}
                  </a>
                ) : (
                  // Not a mailto until it can receive — a link that opens a
                  // mail client to send into a bounce is worse than none.
                  <span className="flex items-baseline gap-3">
                    <span className="text-base text-muted">{CONTACT_EMAIL}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      {t("about.soon")}
                    </span>
                  </span>
                )}
              </li>
            </ul>
          </div>

          {/* Anchored so "leave us feedback" can be linked from anywhere. */}
          <div id="feedback" className="mt-12 pt-8 border-t border-fg/10 scroll-mt-20">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
              {t("feedback.title")}
            </p>
            <p className="text-sm text-muted leading-relaxed mb-5 max-w-xl">
              {t("feedback.intro")}
            </p>
            <FeedbackForm />
          </div>

          <div className="mt-12 pt-8 border-t border-fg/10">
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
