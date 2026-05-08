import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { getTranslations } from "@/i18n/server";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/auth/signin");

  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-12">{t("profile.editProfile")}</h1>
      <ProfileForm user={JSON.parse(JSON.stringify(user))} />
      <div className="mt-12 pt-8 border-t border-fg/10 flex flex-col items-start gap-4">
        <Link href="/profile/edit/password" className="text-sm underline underline-offset-4 hover:no-underline">
          {t("password.title")}
        </Link>
        <DeleteAccount />
      </div>
    </div>
  );
}
