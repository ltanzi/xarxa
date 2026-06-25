import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n/server";

// Interstitial page reached from verification emails. Renders a button
// that POSTs the token to /api/auth/verify-email — keeps state mutation
// off GET so corporate link-prefetchers (Outlook Safe Links, Defender,
// etc.) can't burn the token before the user clicks.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { t } = await getTranslations();

  if (!token) {
    redirect("/auth/verify-pending?error=missing");
  }

  return (
    <main className="max-w-xl mx-auto px-6 pt-32 text-center">
      <h1 className="text-3xl font-light">{t("verification.confirmTitle")}</h1>
      <p className="mt-6 text-muted">{t("verification.confirmBody")}</p>
      <form action="/api/auth/verify-email" method="POST" className="mt-10">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors"
        >
          {t("verification.confirmCta")}
        </button>
      </form>
    </main>
  );
}
