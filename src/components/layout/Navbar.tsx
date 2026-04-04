"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/hook";
import { LanguageSwitcher } from "./LanguageSwitcher";

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 text-[9px] bg-fg text-bg px-1 py-0.5 leading-none min-w-[14px] text-center inline-block">
      {count}
    </span>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);
  const [accepted, setAccepted] = useState(0);

  useEffect(() => {
    if (!session) return;
    async function fetchCounts() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unreadMessages);
        setPending(data.pendingConnections);
        setAccepted(data.acceptedRequests);
      }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between text-sm">
          <Link href="/" className="font-mono font-bold tracking-tight">
            xarxa
          </Link>

          <div className="flex items-center gap-8">
            {session && (
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-muted hover:text-fg transition-colors">
                  {t("nav.dashboard")}
                  <NotifBadge count={pending + accepted} />
                </Link>
                <Link href="/chat" className="text-muted hover:text-fg transition-colors">
                  {t("nav.chat")}
                  <NotifBadge count={unread} />
                </Link>
              </div>
            )}

            {session && (
              <div className="flex items-center gap-6 border-l border-fg/10 pl-8">
                <Link href={`/profile/${session.user.id}`} className="text-muted hover:text-fg transition-colors">
                  {t("nav.profile")}
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-muted hover:text-fg transition-colors">
                  {t("nav.exit")}
                </button>
              </div>
            )}

            {!session && (
              <div className="flex items-center gap-6">
                <Link href="/auth/signin" className="text-muted hover:text-fg transition-colors">
                  {t("nav.signIn")}
                </Link>
                <Link href="/auth/register" className="text-fg underline underline-offset-4 hover:no-underline transition-all">
                  {t("nav.join")}
                </Link>
              </div>
            )}

            <div className="border-l border-fg/10 pl-6">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
