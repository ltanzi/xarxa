import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
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
    </div>
  );
}
