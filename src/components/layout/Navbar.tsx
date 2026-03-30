"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-normal">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-2xl font-500 italic tracking-tight hover-line accent-line">
            xarxa
          </Link>
          <div className="flex items-center gap-8 font-label text-muted">
            <Link href="/board" className="hover:text-fg transition-colors duration-300">
              Board
            </Link>
            {session && (
              <>
                <Link href="/dashboard" className="hover:text-fg transition-colors duration-300">
                  Dashboard
                </Link>
                <Link href="/chat" className="hover:text-fg transition-colors duration-300">
                  Messages
                </Link>
                <Link href={`/profile/${session.user.id}`} className="hover:text-fg transition-colors duration-300">
                  Profile
                </Link>
                <button onClick={() => signOut()} className="hover:text-accent transition-colors duration-300">
                  Exit
                </button>
              </>
            )}
            {!session && (
              <>
                <Link href="/auth/signin" className="hover:text-fg transition-colors duration-300">
                  Sign in
                </Link>
                <Link href="/auth/register" className="text-fg hover:text-accent transition-colors duration-300">
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
