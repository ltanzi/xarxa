import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/auth/signin");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <ProfileForm user={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
