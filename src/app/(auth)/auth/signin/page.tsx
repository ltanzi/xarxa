"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/board");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl font-300 mb-2 animate-in">Sign in</h1>
        <p className="font-label text-muted mb-12 animate-in animate-in-1">Welcome back</p>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in animate-in-2">
          {error && <p className="font-label text-accent">{error}</p>}
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-10 pt-10 border-t border-fg/8 animate-in animate-in-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/board" })}
            className="w-full font-label text-muted hover:text-fg transition-colors duration-300 text-center"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-10 font-label text-muted animate-in animate-in-4">
          No account?{" "}
          <Link href="/auth/register" className="text-fg hover-line">
            Join
          </Link>
        </p>
      </div>
    </div>
  );
}
