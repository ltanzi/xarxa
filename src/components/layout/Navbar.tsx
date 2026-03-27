"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/i18n/hook";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";

export function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              {t("common.appName")}
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/board" className="text-sm text-gray-600 hover:text-gray-900">
                {t("nav.board")}
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    {t("nav.dashboard")}
                  </Link>
                  <Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900">
                    {t("nav.chat")}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/board/new">
                  <Button size="sm">{t("nav.newPost")}</Button>
                </Link>
                <Link href={`/profile/${session.user.id}`}>
                  <Avatar name={session.user.name || "U"} size="sm" />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  {t("common.signOut")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">{t("common.signIn")}</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">{t("common.register")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
