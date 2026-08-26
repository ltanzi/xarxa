"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";
import { resetPasswordSchema } from "@/lib/validations";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      const pwIssue = parsed.error.issues.find((i) => i.path[0] === "password");
      setError(pwIssue?.message || t("common.error"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/signin"), 1500);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data.error === "INVALID" || data.error === "EXPIRED") {
        setError(t("auth.resetPasswordInvalid"));
      } else if (data.error === "VALIDATION" && data.fields?.password) {
        setError(data.fields.password);
      } else {
        setError(t("common.error"));
      }
    } catch (err) {
      console.error("[reset-password] submit failed", err);
      setError(t("common.error"));
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-accent">{t("auth.resetPasswordInvalid")}</p>
          <Link href="/auth/forgot-password" className="mt-6 inline-block text-xs text-fg underline underline-offset-4 hover:no-underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-6">{t("auth.resetPasswordTitle")}</h1>

        {success ? (
          <p className="text-sm text-muted">{t("auth.resetPasswordSuccess")}</p>
        ) : (
          <>
            <p className="text-sm text-muted mb-8">{t("auth.resetPasswordBody")}</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-xs text-accent">{error}</p>}
              <div>
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
                    className="absolute right-0 bottom-2 text-muted hover:text-fg transition-colors p-1 -m-1"
                    aria-pressed={showPassword}
                    aria-label={t(showPassword ? "common.hidePassword" : "common.showPassword")}
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
                <p className="mt-1.5 text-xs text-muted">{t("auth.passwordHint")}</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("auth.updatePassword")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
