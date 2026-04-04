"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema } from "@/lib/validations";
import { useTranslation } from "@/i18n/hook";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ca", label: "Català" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    type: "PRIVATE" as "PRIVATE" | "COLLECTIVE",
    preferredLanguage: "en" as "en" | "es" | "ca",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setServerError(data.error || t("auth.registrationFailed"));
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError(t("auth.signInAfterRegisterFailed"));
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-12">{t("auth.registerTitle")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {serverError && (
            <p className="text-xs text-accent">{serverError}</p>
          )}

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted mb-3">{t("auth.type")}</p>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="PRIVATE"
                  checked={form.type === "PRIVATE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="accent-fg"
                />
                {t("auth.individual")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="COLLECTIVE"
                  checked={form.type === "COLLECTIVE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="accent-fg"
                />
                {t("auth.collective")}
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted mb-3">{t("profile.preferredLanguage")}</p>
            <div className="flex gap-6 text-sm">
              {LANGUAGES.map((lang) => (
                <label key={lang.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value={lang.value}
                    checked={form.preferredLanguage === lang.value}
                    onChange={(e) => updateField("preferredLanguage", e.target.value)}
                    className="accent-fg"
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>

          <Input
            id="name"
            label={t("auth.name")}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
            required
          />
          {form.type === "PRIVATE" && (
            <Input
              id="surname"
              label={t("profile.surname")}
              value={form.surname}
              onChange={(e) => updateField("surname", e.target.value)}
              error={errors.surname}
              required
            />
          )}
          <Input
            id="email"
            label={t("auth.email")}
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            error={errors.email}
            required
          />
          <Input
            id="password"
            label={t("auth.password")}
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            error={errors.password}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("auth.createAccount")}
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/auth/signin" className="text-fg underline underline-offset-4 hover:no-underline">
            {t("auth.signInTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
