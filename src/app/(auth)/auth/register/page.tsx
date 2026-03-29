"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    type: "PRIVATE" as "PRIVATE" | "COLLECTIVE",
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
      setServerError(data.error || "Registration failed");
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
      setServerError("Account created but sign in failed. Please sign in manually.");
    } else {
      router.push("/board");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">{t("auth.registerTitle")}</h1>
          <p className="font-handwritten text-lg text-lime mt-1">let&apos;s get started!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 rounded-2xl border-2 border-gray-100 p-8">
          {serverError && (
            <div className="rounded-xl bg-coral/10 border border-coral/20 p-3 text-sm text-coral font-medium">{serverError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.accountType")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="PRIVATE"
                  checked={form.type === "PRIVATE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">{t("auth.private")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="COLLECTIVE"
                  checked={form.type === "COLLECTIVE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">{t("auth.collective")}</span>
              </label>
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
            {loading ? t("common.loading") : t("common.register")}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/auth/signin" className="text-indigo-600 hover:underline">
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
