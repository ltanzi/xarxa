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
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-12">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-xs text-accent">{error}</p>
          )}
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

        <div className="mt-8 pt-8 border-t border-fg/10">
          <button
            onClick={() => signIn("google", { callbackUrl: "/board" })}
            className="w-full text-sm text-muted hover:text-fg transition-colors text-center"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-8 text-xs text-muted">
          No account?{" "}
          <Link href="/auth/register" className="text-fg underline underline-offset-4 hover:no-underline">
            Join
          </Link>
        </p>
      </div>
    </div>
  );
}
