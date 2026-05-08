"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { passwordChangeSchema } from "@/lib/validations";
import { useTranslation } from "@/i18n/hook";

export function PasswordChangeForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: t("password.confirmMismatch") });
      return;
    }

    const parsed = passwordChangeSchema.safeParse({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "WRONG_PASSWORD") {
          setErrors({ currentPassword: t("password.wrongCurrent") });
        } else {
          setServerError(data.error || t("password.failed"));
        }
        return;
      }

      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.refresh();
    } catch (err) {
      console.error("[PasswordChangeForm]", err);
      setServerError(t("password.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <p className="text-xs text-accent">{serverError}</p>
      )}
      {success && (
        <p className="text-xs text-fg">{t("password.success")}</p>
      )}

      <PasswordInput
        id="currentPassword"
        label={t("password.current")}
        value={form.currentPassword}
        onChange={(e) => updateField("currentPassword", e.target.value)}
        error={errors.currentPassword}
        required
        autoComplete="current-password"
      />

      <div>
        <PasswordInput
          id="newPassword"
          label={t("password.new")}
          value={form.newPassword}
          onChange={(e) => updateField("newPassword", e.target.value)}
          error={errors.newPassword}
          required
          autoComplete="new-password"
        />
        <p className="mt-1.5 text-xs text-muted">{t("auth.passwordHint")}</p>
      </div>

      <PasswordInput
        id="confirmPassword"
        label={t("password.confirm")}
        value={form.confirmPassword}
        onChange={(e) => updateField("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        required
        autoComplete="new-password"
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("password.update")}
      </Button>
    </form>
  );
}
