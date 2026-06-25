import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  // NEXTAUTH_URL: must be an origin only — no trailing slash, no path —
  // because we concatenate paths onto it (e.g. `${NEXTAUTH_URL}/auth/verify`).
  NEXTAUTH_URL: z
    .string()
    .url()
    .refine(
      (v) => {
        const u = new URL(v);
        return u.pathname === "/" && !v.endsWith("/");
      },
      "NEXTAUTH_URL must be an origin with no trailing slash and no path",
    ),
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  SENTRY_DSN: z.string().url().optional(),
  EMAIL_FROM: z.string().email().default("noreply@xarxa.help"),
  OPERATOR_EMAIL: z.string().email().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type Env = z.infer<typeof schema>;

// Skip strict validation during `next build` — env vars aren't supplied at
// build time inside the container. Runtime reload re-validates when the
// server actually starts.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

let env: Env;
if (isBuild) {
  env = process.env as unknown as Env;
} else {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("[env] Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  env = parsed.data;
}

export { env };
