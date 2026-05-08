import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { getTranslations } from "@/i18n/server";

export default async function PasswordPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-md px-6 lg:px-8 pt-24 pb-16">
      <Link href="/profile/edit" className="text-xs text-muted hover:text-fg transition-colors font-mono uppercase tracking-wider">
        &larr; {t("profile.editProfile")}
      </Link>
      <h1 className="text-3xl font-light mt-8 mb-12">{t("password.title")}</h1>
      <PasswordChangeForm />
    </div>
  );
}
