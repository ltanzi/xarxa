"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
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
    <div className="min-h-[85vh] flex items-center px-6 py-20">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-4xl font-300 mb-2 animate-in">Join</h1>
        <p className="font-label text-muted mb-12 animate-in animate-in-1">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in animate-in-2">
          {serverError && <p className="font-label text-accent">{serverError}</p>}

          <div>
            <p className="font-label text-muted mb-4">Type</p>
            <div className="flex gap-8 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="PRIVATE"
                  checked={form.type === "PRIVATE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="accent-[#C4461A]"
                />
                <span className="text-muted group-hover:text-fg transition-colors duration-200">Individual</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="COLLECTIVE"
                  checked={form.type === "COLLECTIVE"}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="accent-[#C4461A]"
                />
                <span className="text-muted group-hover:text-fg transition-colors duration-200">Collective</span>
              </label>
            </div>
          </div>

          <Input id="name" label="Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} error={errors.name} required />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} error={errors.email} required />
          <Input id="password" label="Password" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} error={errors.password} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : "Create account"}
          </Button>
        </form>

        <p className="mt-10 font-label text-muted animate-in animate-in-3">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-fg hover-line">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
