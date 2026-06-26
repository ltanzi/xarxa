import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { getTranslations } from "@/i18n/server";
import ResendButton from "@/components/ResendButton";

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const { t } = await getTranslations();

  if (session?.user?.emailVerified) {
    redirect("/");
  }

  const { error: err } = await searchParams;
  const email = session?.user?.email ?? "";

  return (
    <main className="max-w-xl mx-auto px-6 pt-32 text-center">
      <h1 className="text-3xl font-light">{t("verification.pendingTitle")}</h1>
      <p className="mt-6 text-muted">{t("verification.pendingBody")}</p>
      {err === "expired" && <p className="mt-4 text-rose-700">{t("verification.errorExpired")}</p>}
      {err === "invalid" && <p className="mt-4 text-rose-700">{t("verification.errorInvalid")}</p>}
      {err === "missing" && <p className="mt-4 text-rose-700">{t("verification.errorMissing")}</p>}
      {err === "server" && <p className="mt-4 text-rose-700">{t("verification.errorServer")}</p>}
      {email && <ResendButton email={email} />}
    </main>
  );
}
