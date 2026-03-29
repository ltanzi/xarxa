"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between text-sm">
          <Link href="/" className="font-mono font-bold tracking-tight">
            xarxa
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/board" className="text-muted hover:text-fg transition-colors">
              Board
            </Link>
            {session && (
              <>
                <Link href="/dashboard" className="text-muted hover:text-fg transition-colors">
                  Dashboard
                </Link>
                <Link href="/chat" className="text-muted hover:text-fg transition-colors">
                  Chat
                </Link>
                <Link href={`/profile/${session.user.id}`} className="text-muted hover:text-fg transition-colors">
                  Profile
                </Link>
                <button onClick={() => signOut()} className="text-muted hover:text-fg transition-colors">
                  Exit
                </button>
              </>
            )}
            {!session && (
              <>
                <Link href="/auth/signin" className="text-muted hover:text-fg transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/register" className="text-fg underline underline-offset-4 hover:no-underline transition-all">
                  Join
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
