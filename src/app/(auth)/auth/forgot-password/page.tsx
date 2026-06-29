"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("[forgot-password] submit failed", err);
    }
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-6">{t("auth.forgotPasswordTitle")}</h1>

        {sent ? (
          <p className="text-sm text-muted">{t("auth.forgotPasswordSent")}</p>
        ) : (
          <>
            <p className="text-sm text-muted mb-8">{t("auth.forgotPasswordBody")}</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="email"
                label={t("auth.email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("auth.sendResetLink")}
              </Button>
            </form>
          </>
        )}

        <p className="mt-8 text-xs text-muted">
          <Link href="/auth/signin" className="text-fg underline underline-offset-4 hover:no-underline">
            {t("auth.signInTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
