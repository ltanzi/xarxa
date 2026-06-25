"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      // NextAuth v5 surfaces the CredentialsSignin subclass via result.code.
      if (result.code === "rate_limit") {
        setError(t("auth.rateLimited"));
      } else {
        setError(t("auth.invalidCredentials"));
      }
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-12">{t("auth.signInTitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-xs text-accent">{error}</p>
          )}
          <Input
            id="email"
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              id="password"
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 bottom-2 text-muted hover:text-fg transition-colors"
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("auth.signInTitle")}
          </Button>
        </form>

        {/* Google OAuth — commented out for now
        <div className="mt-8 pt-8 border-t border-fg/10">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full text-sm text-muted hover:text-fg transition-colors text-center"
          >
            {t("auth.continueWithGoogle")}
          </button>
        </div>
        */}

        <p className="mt-8 text-xs text-muted">
          {t("auth.noAccount")}{" "}
          <Link href="/auth/register" className="text-fg underline underline-offset-4 hover:no-underline">
            {t("nav.join")}
          </Link>
        </p>
      </div>
    </div>
  );
}
