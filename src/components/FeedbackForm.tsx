"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";
import { feedbackSchema } from "@/lib/validations";

export function FeedbackForm() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = feedbackSchema.safeParse({ message, path: pathname });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, path: pathname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "RATE_LIMIT" ? t("feedback.tooMany") : t("common.error"));
        return;
      }
      setSent(true);
      setMessage("");
    } catch (err) {
      console.error("[FeedbackForm]", err);
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  // Don't flash the sign-in prompt at someone who is signed in — the
  // session resolves a beat after first paint.
  if (status === "loading") return null;

  if (!session) {
    return (
      <p className="text-sm text-muted">
        <Link href="/auth/signin" className="text-fg underline underline-offset-4 hover:no-underline">
          {t("feedback.signInCta")}
        </Link>{" "}
        {t("feedback.signInRest")}
      </p>
    );
  }

  // Deliberately terminal: no "send another" button. One thought per visit is
  // the honest volume, and a cleared form invites padding it out.
  if (sent) {
    return <p className="text-sm text-fg">{t("feedback.thanks")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      <Textarea
        id="feedback"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label={t("feedback.label")}
        placeholder={t("feedback.placeholder")}
        rows={4}
        maxLength={2000}
      />

      {error && <p className="text-xs text-accent" role="alert">{error}</p>}

      <Button type="submit" disabled={loading} className="self-start">
        {loading ? t("common.loading") : t("feedback.send")}
      </Button>
    </form>
  );
}
