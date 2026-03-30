"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between text-[10px] uppercase tracking-widest">
          <Link href="/" className="font-headline text-base normal-case tracking-tight">
            xarxa
          </Link>
          <div className="flex items-center gap-5 text-muted">
            <Link href="/board" className="hover:text-fg transition-colors">
              Board
            </Link>
            {session && (
              <>
                <Link href="/dashboard" className="hover:text-fg transition-colors">
                  Dashboard
                </Link>
                <Link href="/chat" className="hover:text-fg transition-colors">
                  Chat
                </Link>
                <Link href={`/profile/${session.user.id}`} className="hover:text-fg transition-colors">
                  Profile
                </Link>
                <button onClick={() => signOut()} className="hover:text-fg transition-colors">
                  Exit
                </button>
              </>
            )}
            {!session && (
              <>
                <Link href="/auth/signin" className="hover:text-fg transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/register" className="text-fg">
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
