"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "@/i18n/hook";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { io, Socket } from "socket.io-client";

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 text-[9px] bg-fg text-bg px-1 py-0.5 leading-none min-w-[14px] text-center inline-block">
      {count}
    </span>
  );
}

function ExitButton({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-muted hover:text-fg transition-colors">
        {t("nav.exit")}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <span className="text-muted">{t("nav.confirmExit")}</span>
      <button onClick={onConfirm} className="text-fg hover:opacity-60 transition-opacity">
        {t("nav.yes")}
      </button>
      <button onClick={() => setConfirming(false)} className="text-muted hover:text-fg transition-colors">
        {t("nav.no")}
      </button>
    </span>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchCounts = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setUnread(data.unreadMessages);
      setPending(data.pendingConnections);
      setAccepted(data.acceptedRequests);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    fetchCounts();

    // Listen for local custom events (e.g. from ChatRoom on mount)
    window.addEventListener("notifications:refresh", fetchCounts);

    // Connect to Socket.io for real-time notification updates
    const socket = io({
      path: "/api/socketio",
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });
    socketRef.current = socket;

    socket.on("notifications:update", fetchCounts);

    return () => {
      window.removeEventListener("notifications:refresh", fetchCounts);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, fetchCounts]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between text-sm">
          <Link href="/" className="font-mono font-bold tracking-tight" onClick={() => setMenuOpen(false)}>
            xarxa
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {session && (
              <div className="flex items-center gap-6">
                <Link href="/board" className="text-muted hover:text-fg transition-colors">
                  {t("nav.board")}
                </Link>
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
                <ExitButton onConfirm={() => signOut({ callbackUrl: "/" })} />
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
            <div className="flex items-center gap-6 border-l border-fg/10 pl-6">
              <Link href="/about" className="text-muted hover:text-fg transition-colors">
                {t("nav.about")}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile: badges + hamburger */}
          <div className="flex md:hidden items-center gap-4">
            {session && (pending + accepted + unread > 0) && (
              <span className="text-[9px] bg-fg text-bg px-1.5 py-0.5 leading-none">
                {pending + accepted + unread}
              </span>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-fg transition-colors"
            >
              {menuOpen ? t("nav.close") : t("nav.menu")}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-fg/10 bg-bg/95 px-6 pb-6 pt-4 flex flex-col gap-5 text-sm">
          {session && (
            <>
              <Link href="/board" className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
                {t("nav.board")}
              </Link>
              <Link href="/dashboard" className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
                {t("nav.dashboard")}
                <NotifBadge count={pending + accepted} />
              </Link>
              <Link href="/chat" className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
                {t("nav.chat")}
                <NotifBadge count={unread} />
              </Link>
              <Link href={`/profile/${session.user.id}`} className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
                {t("nav.profile")}
              </Link>
              <ExitButton onConfirm={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }} />
            </>
          )}
          {!session && (
            <>
              <Link href="/auth/signin" className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
                {t("nav.signIn")}
              </Link>
              <Link href="/auth/register" className="text-fg underline underline-offset-4" onClick={() => setMenuOpen(false)}>
                {t("nav.join")}
              </Link>
            </>
          )}
          <Link href="/about" className="text-muted hover:text-fg transition-colors" onClick={() => setMenuOpen(false)}>
            {t("nav.about")}
          </Link>
          <div className="pt-2 border-t border-fg/10">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
