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
    <nav className="border-b-2 border-dashed border-gray-200 bg-cream/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-800 tracking-tight">
              <span className="text-coral">x</span>
              <span className="text-violet">a</span>
              <span className="text-lime">r</span>
              <span className="text-sky">x</span>
              <span className="text-sunflower">a</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/board" className="text-sm font-600 text-gray-600 hover:text-coral transition-colors">
                {t("nav.board")}
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="text-sm font-600 text-gray-600 hover:text-violet transition-colors">
                    {t("nav.dashboard")}
                  </Link>
                  <Link href="/chat" className="text-sm font-600 text-gray-600 hover:text-sky transition-colors">
                    {t("nav.chat")}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
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
