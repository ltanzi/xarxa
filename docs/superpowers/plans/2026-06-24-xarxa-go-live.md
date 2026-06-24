# xarxa — Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-24-xarxa-go-live-design.md`

**Goal:** Move xarxa from MacBook + Cloudflare-tunnel friend-beta to a real production deployment on `https://xarxa.org` with email-verified accounts, off-box encrypted backups, error + uptime monitoring, and the minimum security hardening for an internet-facing app.

**Architecture:** One Hetzner CX22 box runs Caddy (TLS terminator) → Next.js + Socket.io app (in Docker) → Postgres 16 (in Docker), with `systemd` supervising `docker compose`. Cloudflare provides DNS-only and registrar. Resend handles transactional email. Sentry + UptimeRobot watch the box. Nightly `pg_dump` + `restic` backups go to Backblaze B2.

**Tech Stack:** Next.js 14, Prisma 7, PostgreSQL 16, NextAuth v5, Socket.io, Docker Compose, Caddy 2, Resend, React Email, Sentry, Backblaze B2, restic, GPG.

## Global Constraints

- Budget ceiling: ~€80/year at friend-beta scale; do not introduce paid services beyond Hetzner CX22 (€54/yr) + Hetzner snapshot (€5/yr) + domain (€11/yr).
- No test runner exists; verification is by-exercise (smoke against the running app, `curl` checks, acceptance criteria). Spec defers a real test suite to a future phase.
- Every code change is a separate commit on `main` (no PR review process — single operator).
- No secret value ever appears in a tool result, a log, or a git commit. Generate on the box, write to `/etc/xarxa/.env` (mode 600) or `/etc/xarxa/backup.key` (mode 400 root).
- `prisma db push` is the migration tool (consistent with existing `deploy.sh`). No `prisma migrate` files.
- All user-facing copy supports EN/ES/CA via the existing i18n system. Email templates render in `user.preferredLanguage`, fall back to EN.

## Phase Map

| Phase | Where work happens | Concurrent with operator action? |
|---|---|---|
| A — App code changes | Local dev workstation | No (Claude drives, operator reviews commits) |
| B — Production config files | Local dev workstation | No |
| C — Account creation | Operator's browser | Yes — operator does C while Claude finishes A+B |
| D — Box bootstrap | SSH'd into Hetzner | Sequential after C completes |
| E — DNS records | Cloudflare dashboard / API | Sequential after C1 |
| F — First deploy | SSH'd into Hetzner | Sequential after D+E |
| G — Monitoring wire-up | Mostly SSH, some browser | Sequential after F |
| H — Backups + restore drill | SSH + local Docker | Sequential after G |
| I — Documentation + release | Local | Final |

Natural session-break points are between phases. The operator can stop, sleep, come back to the next phase fresh.

---

## Phase A — App code changes (local)

All work in this phase happens on the dev workstation against the existing local Postgres. Each task ends with a smoke step (`npm run dev` and exercise the change in a browser) and a commit.

### Task A1: Prisma schema — emailVerified + VerificationToken

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts` (set `emailVerified` on seeded users)

**Produces:** `User.emailVerified: DateTime?`, new model `VerificationToken { identifier, token, expires }`.

- [ ] **A1.1** — Edit `prisma/schema.prisma`. In the `User` model, add `emailVerified DateTime?` next to `createdAt`. After the `User` model, add:
  ```prisma
  model VerificationToken {
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
    @@index([expires])
  }
  ```
- [ ] **A1.2** — Edit `prisma/seed.ts`. In each `prisma.user.create` block, add `emailVerified: new Date()` so the seeded demo accounts are verified.
- [ ] **A1.3** — Apply non-destructively: `npx prisma db push`. Backfill existing rows so demo users don't get locked out: `psql postgresql://xarxa:xarxa@localhost:5432/xarxa -c 'UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;'`.
- [ ] **A1.4** — Verify: `psql postgresql://xarxa:xarxa@localhost:5432/xarxa -c '\d "User"'` shows `emailVerified` column; `\dt` shows `VerificationToken` table.
- [ ] **A1.5** — Commit: `git add prisma/ && git commit -m "feat(prisma): add emailVerified + VerificationToken"`

### Task A2: Env validation module

**Files:**
- Create: `src/lib/env.ts`

**Produces:** Exported `env` object with validated `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `SENTRY_DSN`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID?`, `GOOGLE_CLIENT_SECRET?`, `NODE_ENV`.

- [ ] **A2.1** — Create `src/lib/env.ts`:
  ```ts
  import { z } from "zod";

  const schema = z.object({
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    SENTRY_DSN: z.string().url().optional(),
    EMAIL_FROM: z.string().email().default("noreply@xarxa.org"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  });

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  export const env = parsed.data;
  ```
- [ ] **A2.2** — Add to `src/lib/prisma.ts` at top: `import "@/lib/env";` (import for side-effect — validates at boot).
- [ ] **A2.3** — Smoke: `npm run dev`. Should boot. Then temporarily unset `NEXTAUTH_SECRET` and re-run — should fail fast with a clear error.
- [ ] **A2.4** — Commit: `git add src/lib/env.ts src/lib/prisma.ts && git commit -m "feat(env): Zod validation of process.env at boot"`

### Task A3: Resend email client wrapper

**Files:**
- Create: `src/lib/email.ts`

**Produces:** `sendVerificationEmail(email, locale, plainToken)`, `sendWelcomeEmail(email, locale, name)`.

- [ ] **A3.1** — Install: `npm install resend react-email @react-email/components`
- [ ] **A3.2** — Create `src/lib/email.ts`:
  ```ts
  import { Resend } from "resend";
  import { env } from "@/lib/env";
  import VerifyEmail from "@/emails/VerifyEmail";
  import { render } from "@react-email/render";

  const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

  type Locale = "en" | "es" | "ca";

  export async function sendVerificationEmail(
    email: string,
    locale: Locale,
    plainToken: string,
  ): Promise<void> {
    if (!client) {
      console.warn("[email] RESEND_API_KEY not set; skipping send", { email, locale });
      return;
    }
    const verifyUrl = `${env.NEXTAUTH_URL}/api/auth/verify-email?token=${plainToken}`;
    const subject = {
      en: "Verify your email — xarxa",
      es: "Verifica tu email — xarxa",
      ca: "Verifica el teu correu — xarxa",
    }[locale];

    const html = await render(VerifyEmail({ locale, verifyUrl }));
    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject,
      html,
    });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
  }
  ```
- [ ] **A3.3** — Commit (template file in next task): `git add src/lib/email.ts package.json package-lock.json && git commit -m "feat(email): Resend client wrapper"`

### Task A4: VerifyEmail React Email template

**Files:**
- Create: `src/emails/VerifyEmail.tsx`

- [ ] **A4.1** — Create `src/emails/VerifyEmail.tsx`:
  ```tsx
  import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

  type Locale = "en" | "es" | "ca";

  const copy = {
    en: {
      preview: "Verify your email to start using xarxa",
      heading: "Verify your email",
      body: "Click the link below to verify your email address and finish setting up your xarxa account.",
      cta: "Verify email",
      ignore: "If you didn't sign up for xarxa, you can ignore this email.",
    },
    es: {
      preview: "Verifica tu email para empezar a usar xarxa",
      heading: "Verifica tu email",
      body: "Haz clic en el enlace de abajo para verificar tu correo y completar tu cuenta en xarxa.",
      cta: "Verificar email",
      ignore: "Si no te has registrado en xarxa, puedes ignorar este correo.",
    },
    ca: {
      preview: "Verifica el teu correu per començar a usar xarxa",
      heading: "Verifica el teu correu",
      body: "Fes clic a l'enllaç de sota per verificar el teu correu i completar el teu compte a xarxa.",
      cta: "Verificar correu",
      ignore: "Si no t'has registrat a xarxa, pots ignorar aquest correu.",
    },
  };

  export default function VerifyEmail({ locale, verifyUrl }: { locale: Locale; verifyUrl: string }) {
    const t = copy[locale];
    return (
      <Html>
        <Head />
        <Preview>{t.preview}</Preview>
        <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#EDE8E0", padding: "32px" }}>
          <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", padding: "32px" }}>
            <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>{t.heading}</Heading>
            <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{t.body}</Text>
            <Text style={{ marginTop: "24px" }}>
              <Link href={verifyUrl} style={{ display: "inline-block", padding: "12px 24px", backgroundColor: "#000", color: "#fff", textDecoration: "none" }}>
                {t.cta}
              </Link>
            </Text>
            <Text style={{ fontSize: "14px", color: "#888", marginTop: "32px" }}>{t.ignore}</Text>
            <Text style={{ fontSize: "12px", color: "#aaa", marginTop: "16px", wordBreak: "break-all" }}>{verifyUrl}</Text>
          </Container>
        </Body>
      </Html>
    );
  }
  ```
- [ ] **A4.2** — Preview locally: `npx react-email dev --dir src/emails` (optional, just to eyeball)
- [ ] **A4.3** — Commit: `git add src/emails/ && git commit -m "feat(email): VerifyEmail template (EN/ES/CA)"`

### Task A5: requireVerifiedUser helper

**Files:**
- Modify: `src/lib/auth-utils.ts`

**Produces:** `requireVerifiedUser()` server-side helper that returns the session if verified, else NextResponse 403.

- [ ] **A5.1** — Open `src/lib/auth-utils.ts`. Add at the bottom:
  ```ts
  import { NextResponse } from "next/server";
  import { getServerSession } from "next-auth";
  import { authOptions } from "@/lib/auth";

  export async function requireVerifiedUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }), session: null };
    }
    if (!session.user.emailVerified) {
      return { error: NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 }), session: null };
    }
    return { error: null, session };
  }
  ```
- [ ] **A5.2** — Check `src/types/next-auth.d.ts` (or wherever Session is augmented). Add `emailVerified: Date | null` to the user shape. If the file doesn't exist, create it:
  ```ts
  import "next-auth";
  declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        email: string;
        name: string;
        type: "PRIVATE" | "COLLECTIVE";
        emailVerified: Date | null;
      };
    }
  }
  ```
- [ ] **A5.3** — Modify `src/lib/auth.ts` `callbacks.session` to include `emailVerified` from the JWT and `callbacks.jwt` to read it from the user. Search the file for `token.emailVerified` patterns; ensure both jwt() and session() pass it through.
- [ ] **A5.4** — Commit: `git add src/lib/auth-utils.ts src/lib/auth.ts src/types/ && git commit -m "feat(auth): requireVerifiedUser helper + Session type for emailVerified"`

### Task A6: Modified register route — issue token + send email

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

- [ ] **A6.1** — Read the current `src/app/api/auth/register/route.ts` to understand the existing shape.
- [ ] **A6.2** — Modify the route. After the user create call, add:
  ```ts
  import { randomBytes, createHash } from "crypto";
  import { sendVerificationEmail } from "@/lib/email";

  // ...after creating `user`...

  const plainToken = randomBytes(32).toString("base64url");
  const hashedToken = createHash("sha256").update(plainToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashedToken,
      expires,
    },
  });

  try {
    await sendVerificationEmail(user.email, (user.preferredLanguage as "en" | "es" | "ca") ?? "en", plainToken);
  } catch (err) {
    console.error("[register] verification email send failed", err);
    // user is created; they can resend from /auth/verify-pending
  }

  // Ensure the response is 200 even if email send failed.
  ```
- [ ] **A6.3** — In the same route, ensure the new user is created with `emailVerified: undefined` (Prisma will use null). The register Zod schema does not need changes.
- [ ] **A6.4** — Smoke: `npm run dev`. POST to `/api/auth/register` with a fresh email. Check `psql ... -c 'SELECT email, "emailVerified" FROM "User" WHERE email = ...'` — emailVerified is NULL. Check `SELECT * FROM "VerificationToken"` — row exists. Console shows the `[email] RESEND_API_KEY not set; skipping send` warning (expected — no key yet).
- [ ] **A6.5** — Commit: `git add src/app/api/auth/register/route.ts && git commit -m "feat(register): issue verification token + send email (Resend not wired yet)"`

### Task A7: verify-email endpoint

**Files:**
- Create: `src/app/api/auth/verify-email/route.ts`

- [ ] **A7.1** — Create the file:
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { createHash } from "crypto";
  import { prisma } from "@/lib/prisma";
  import { env } from "@/lib/env";

  export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const plainToken = url.searchParams.get("token");
    if (!plainToken) return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=missing`);

    const hashedToken = createHash("sha256").update(plainToken).digest("hex");
    const row = await prisma.verificationToken.findUnique({ where: { token: hashedToken } });

    if (!row) return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=invalid`);
    if (row.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token: hashedToken } });
      return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=expired`);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: row.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token: hashedToken } }),
    ]);

    return NextResponse.redirect(`${env.NEXTAUTH_URL}/?verified=1`);
  }
  ```
- [ ] **A7.2** — Smoke: register a user (Task A6), grab the plainToken by SELECTing on the row — wait, the DB only has the hashed token. Easier smoke: temporarily `console.log(plainToken)` in the register route, register, then visit `http://localhost:3000/api/auth/verify-email?token=<that-value>` — should 302 to `/?verified=1` and the User row's emailVerified now set. Remove the console.log after.
- [ ] **A7.3** — Commit: `git add src/app/api/auth/verify-email/ && git commit -m "feat(auth): /api/auth/verify-email endpoint"`

### Task A8: resend-verification endpoint

**Files:**
- Create: `src/app/api/auth/resend-verification/route.ts`

- [ ] **A8.1** — Create the file:
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { randomBytes, createHash } from "crypto";
  import { prisma } from "@/lib/prisma";
  import { sendVerificationEmail } from "@/lib/email";

  export async function POST(req: NextRequest) {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true });  // pretend success; don't reveal user existence
    if (user.emailVerified) return NextResponse.json({ ok: true });  // already verified

    // delete any existing tokens for this identifier (one active token at a time)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const plainToken = randomBytes(32).toString("base64url");
    const hashedToken = createHash("sha256").update(plainToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: email, token: hashedToken, expires },
    });

    try {
      await sendVerificationEmail(email, (user.preferredLanguage as "en" | "es" | "ca") ?? "en", plainToken);
    } catch (err) {
      console.error("[resend-verification] send failed", err);
      return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }
  ```
- [ ] **A8.2** — Smoke: `curl -X POST -H 'Content-Type: application/json' -d '{"email":"<your-test-email>"}' http://localhost:3000/api/auth/resend-verification` returns `{ok:true}` and a new VerificationToken row replaces the old one.
- [ ] **A8.3** — Commit: `git add src/app/api/auth/resend-verification/ && git commit -m "feat(auth): /api/auth/resend-verification endpoint"`

### Task A9: verify-pending page

**Files:**
- Create: `src/app/auth/verify-pending/page.tsx`

- [ ] **A9.1** — Create:
  ```tsx
  import { getServerSession } from "next-auth";
  import { authOptions } from "@/lib/auth";
  import { redirect } from "next/navigation";
  import { getTranslations } from "@/i18n/server";
  import ResendButton from "@/components/ResendButton";

  export default async function VerifyPendingPage({ searchParams }: { searchParams: { error?: string } }) {
    const session = await getServerSession(authOptions);
    const { t } = await getTranslations();
    if (session?.user?.emailVerified) redirect("/");

    const err = searchParams.error;
    const email = session?.user?.email ?? "";

    return (
      <main className="max-w-xl mx-auto px-6 pt-32 text-center">
        <h1 className="text-3xl font-light">{t("verification.pendingTitle")}</h1>
        <p className="mt-6 text-muted">{t("verification.pendingBody")}</p>
        {err === "expired" && <p className="mt-4 text-rose-700">{t("verification.errorExpired")}</p>}
        {err === "invalid" && <p className="mt-4 text-rose-700">{t("verification.errorInvalid")}</p>}
        {err === "missing" && <p className="mt-4 text-rose-700">{t("verification.errorMissing")}</p>}
        {email && <ResendButton email={email} />}
      </main>
    );
  }
  ```
- [ ] **A9.2** — Create `src/components/ResendButton.tsx`:
  ```tsx
  "use client";
  import { useState } from "react";
  import { useTranslation } from "@/i18n/hook";

  export default function ResendButton({ email }: { email: string }) {
    const { t } = useTranslation();
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    async function resend() {
      setStatus("sending");
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    }

    return (
      <button
        onClick={resend}
        disabled={status === "sending" || status === "sent"}
        className="mt-8 px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors disabled:opacity-50"
      >
        {status === "sent" ? t("verification.resent") : t("verification.resend")}
      </button>
    );
  }
  ```
- [ ] **A9.3** — Smoke: visit `http://localhost:3000/auth/verify-pending` while signed in to an unverified account. Click resend. See `?` status update.
- [ ] **A9.4** — Commit: `git add src/app/auth/verify-pending/ src/components/ResendButton.tsx && git commit -m "feat(auth): /auth/verify-pending page + resend button"`

### Task A10: VerifyEmailBanner component

**Files:**
- Create: `src/components/VerifyEmailBanner.tsx`
- Modify: `src/app/layout.tsx` (mount banner globally below navbar)

- [ ] **A10.1** — Create:
  ```tsx
  "use client";
  import { useSession } from "next-auth/react";
  import Link from "next/link";
  import { useTranslation } from "@/i18n/hook";

  export default function VerifyEmailBanner() {
    const { data: session } = useSession();
    const { t } = useTranslation();
    if (!session?.user) return null;
    if (session.user.emailVerified) return null;
    return (
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900 text-center">
        {t("verification.bannerText")}{" "}
        <Link href="/auth/verify-pending" className="underline">
          {t("verification.bannerLink")}
        </Link>
      </div>
    );
  }
  ```
- [ ] **A10.2** — Edit `src/app/layout.tsx`. Import and mount `<VerifyEmailBanner />` immediately after the Navbar.
- [ ] **A10.3** — Smoke: as an unverified user, every page shows the banner. As a verified user, no banner.
- [ ] **A10.4** — Commit: `git add src/components/VerifyEmailBanner.tsx src/app/layout.tsx && git commit -m "feat(ui): verify-email banner for unverified users"`

### Task A11: Gate POST /api/posts

**Files:**
- Modify: `src/app/api/posts/route.ts`

- [ ] **A11.1** — At the top of the `POST` handler, replace existing auth check with:
  ```ts
  import { requireVerifiedUser } from "@/lib/auth-utils";

  // inside POST:
  const { error, session } = await requireVerifiedUser();
  if (error) return error;
  // continue with session.user.id...
  ```
- [ ] **A11.2** — Smoke: as unverified user, `curl -X POST .../api/posts ...` returns 403 with `{error:"EMAIL_NOT_VERIFIED"}`. Verified user: works.
- [ ] **A11.3** — Commit: `git add src/app/api/posts/route.ts && git commit -m "feat(posts): gate POST behind email verification"`

### Task A12: Gate POST /api/connections

**Files:**
- Modify: `src/app/api/connections/route.ts`

- [ ] **A12.1** — Same pattern as A11 at the top of the `POST` handler.
- [ ] **A12.2** — Smoke: as unverified user, can't express interest → 403.
- [ ] **A12.3** — Commit: `git add src/app/api/connections/route.ts && git commit -m "feat(connections): gate POST behind email verification"`

### Task A13: Gate Socket.io send-message

**Files:**
- Modify: `server.ts`

- [ ] **A13.1** — Find the `send-message` handler. After resolving the authenticated user (the existing JWT-decode middleware sets a `userId` on the socket), look up the user's `emailVerified`. If null, emit an error and return without broadcasting:
  ```ts
  socket.on("send-message", async (data) => {
    // ...existing room-membership check...
    const sender = await prisma.user.findUnique({ where: { id: socket.data.userId }, select: { emailVerified: true } });
    if (!sender?.emailVerified) {
      socket.emit("error", { code: "EMAIL_NOT_VERIFIED" });
      return;
    }
    // ...existing message creation + broadcast...
  });
  ```
- [ ] **A13.2** — In the client chat code (find it via `grep -rn "send-message" src/`), handle the new error: don't crash the optimistic UI; show the same "Verify your email to do this" toast.
- [ ] **A13.3** — Rebuild server: `npm run dev`. Smoke: unverified user can connect to socket but `send-message` is rejected.
- [ ] **A13.4** — Commit: `git add server.ts src/ && git commit -m "feat(chat): gate send-message behind email verification"`

### Task A14: Google OAuth auto-verifies

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **A14.1** — In the NextAuth options, find the Google provider callback. In `callbacks.signIn` (or the adapter `createUser` if using one), set `emailVerified = new Date()` for OAuth users on first sign-in:
  ```ts
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email_verified) {
        await prisma.user.update({
          where: { email: user.email! },
          data: { emailVerified: user.emailVerified ?? new Date() },
        });
      }
      return true;
    },
    // ... existing jwt + session callbacks
  }
  ```
- [ ] **A14.2** — Smoke (deferred to first deploy — local Google OAuth requires a configured client). Manual SQL check possible: connect a fresh Google account locally if `GOOGLE_CLIENT_ID` is set; otherwise skip.
- [ ] **A14.3** — Commit: `git add src/lib/auth.ts && git commit -m "feat(auth): Google OAuth users auto-verified"`

### Task A15: i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/ca.json`

- [ ] **A15.1** — In `en.json`, add a `verification` section:
  ```json
  "verification": {
    "pendingTitle": "Check your email",
    "pendingBody": "We sent you a link to verify your email. Click it to finish signing up.",
    "errorExpired": "That link has expired. Get a new one below.",
    "errorInvalid": "That link is invalid. Get a new one below.",
    "errorMissing": "No token provided.",
    "resend": "Resend verification email",
    "resent": "Sent — check your inbox",
    "bannerText": "Your email isn't verified yet.",
    "bannerLink": "Verify now",
    "blockedTooltip": "Verify your email to do this"
  }
  ```
- [ ] **A15.2** — Add the equivalent Spanish keys to `es.json`:
  ```json
  "verification": {
    "pendingTitle": "Revisa tu email",
    "pendingBody": "Te hemos enviado un enlace para verificar tu correo. Haz clic para terminar el registro.",
    "errorExpired": "El enlace ha caducado. Solicita otro abajo.",
    "errorInvalid": "El enlace no es válido. Solicita otro abajo.",
    "errorMissing": "No se ha proporcionado token.",
    "resend": "Reenviar correo de verificación",
    "resent": "Enviado — revisa tu bandeja",
    "bannerText": "Tu correo aún no está verificado.",
    "bannerLink": "Verificar ahora",
    "blockedTooltip": "Verifica tu correo para hacer esto"
  }
  ```
- [ ] **A15.3** — Add the Catalan keys to `ca.json`:
  ```json
  "verification": {
    "pendingTitle": "Revisa el teu correu",
    "pendingBody": "T'hem enviat un enllaç per verificar el teu correu. Fes clic per acabar el registre.",
    "errorExpired": "L'enllaç ha caducat. Demana'n un de nou a sota.",
    "errorInvalid": "L'enllaç no és vàlid. Demana'n un de nou a sota.",
    "errorMissing": "No s'ha proporcionat el token.",
    "resend": "Reenviar correu de verificació",
    "resent": "Enviat — revisa la safata d'entrada",
    "bannerText": "El teu correu encara no està verificat.",
    "bannerLink": "Verificar ara",
    "blockedTooltip": "Verifica el teu correu per fer això"
  }
  ```
- [ ] **A15.4** — Smoke: switch language in nav, verify pending page renders in each language.
- [ ] **A15.5** — Commit: `git add src/i18n/locales/ && git commit -m "i18n: verification keys for EN/ES/CA"`

### Task A16: Rate-limit module

**Files:**
- Create: `src/lib/rate-limit.ts`

- [ ] **A16.1** — Create:
  ```ts
  type Bucket = { count: number; resetAt: number };
  const buckets = new Map<string, Bucket>();
  const MAX_BUCKETS = 10_000;

  export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

  export function limit(key: string, max: number, windowMs: number): LimitResult {
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      // simple LRU-ish eviction
      if (buckets.size >= MAX_BUCKETS) {
        const oldest = buckets.keys().next().value;
        if (oldest) buckets.delete(oldest);
      }
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count++;
    if (b.count > max) {
      return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
    }
    return { ok: true };
  }

  export function ipKey(req: { headers: { get(name: string): string | null } }): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
  }
  ```
- [ ] **A16.2** — Commit: `git add src/lib/rate-limit.ts && git commit -m "feat(rate-limit): in-memory token-bucket limiter"`

### Task A17: Apply rate limits

**Files:**
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/auth/resend-verification/route.ts`
- Modify: `src/app/api/posts/route.ts`
- Modify: `src/app/api/connections/route.ts`
- Modify: `server.ts` (send-message)
- Modify: `src/lib/auth.ts` (credentials provider authorize)

Apply limits per the spec's table.

- [ ] **A17.1** — `register/route.ts` — top of POST:
  ```ts
  import { limit, ipKey } from "@/lib/rate-limit";
  const r = limit(`register:${ipKey(req)}`, 5, 60 * 60 * 1000);
  if (!r.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } });
  ```
- [ ] **A17.2** — `resend-verification/route.ts` — top of POST, per-email:
  ```ts
  const per1m = limit(`resend:1m:${email}`, 1, 60 * 1000);
  const per1h = limit(`resend:1h:${email}`, 5, 60 * 60 * 1000);
  if (!per1m.ok || !per1h.ok) {
    const retry = Math.max(per1m.ok ? 0 : per1m.retryAfterSec, per1h.ok ? 0 : per1h.retryAfterSec);
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  ```
- [ ] **A17.3** — `posts/route.ts` POST — after `requireVerifiedUser()`:
  ```ts
  const r = limit(`post:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!r.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } });
  ```
- [ ] **A17.4** — `connections/route.ts` POST — same pattern, 30/day:
  ```ts
  const r = limit(`conn:${session.user.id}`, 30, 24 * 60 * 60 * 1000);
  ```
- [ ] **A17.5** — `server.ts` send-message — after verified check:
  ```ts
  import { limit } from "./src/lib/rate-limit";
  const r = limit(`msg:${socket.data.userId}`, 20, 60 * 1000);
  if (!r.ok) { socket.emit("error", { code: "RATE_LIMIT" }); return; }
  ```
- [ ] **A17.6** — `auth.ts` credentials provider's `authorize` callback (sign-in throttle): on every call, limit by IP + email:
  ```ts
  // inside authorize, before the bcrypt compare:
  const reqIp = req?.headers?.["x-forwarded-for"]?.toString().split(",")[0] ?? "unknown";
  const lipIp = limit(`signin:ip:${reqIp}`, 10, 60 * 60 * 1000);
  const lipEmail = limit(`signin:em:${credentials.email}`, 5, 60 * 60 * 1000);
  if (!lipIp.ok || !lipEmail.ok) throw new Error("RATE_LIMIT");
  ```
  (NextAuth surfaces the thrown message; sign-in form catches and shows "Too many tries, wait.")
- [ ] **A17.7** — Smoke: `for i in $(seq 1 6); do curl -X POST -H 'Content-Type: application/json' -d '{"email":"foo'$i'@x.com","password":"Password1!","name":"F","type":"PRIVATE"}' http://localhost:3000/api/auth/register; echo; done` — 6th call returns 429.
- [ ] **A17.8** — Commit: `git add -A && git commit -m "feat(rate-limit): apply limits to auth + posts + connections + send-message"`

### Task A18: Bump bcrypt cost

**Files:**
- Modify: `src/lib/auth.ts` (or wherever `bcrypt.hash` / `bcrypt.compare` is called)
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `prisma/seed.ts`

- [ ] **A18.1** — `grep -rn "bcrypt\." src/ prisma/` — find every site where the cost factor is set. Bump all to **12**.
- [ ] **A18.2** — Re-seed: `npx prisma db push --force-reset && npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts`.
- [ ] **A18.3** — Smoke: sign in as `emma@example.com` with `Password1!` — works (compare is cost-agnostic). Register a new user — hash takes ~250ms.
- [ ] **A18.4** — Commit: `git add -A && git commit -m "feat(auth): bump bcrypt cost factor to 12"`

### Task A19: Security headers in next.config.mjs

**Files:**
- Modify: `next.config.mjs`

- [ ] **A19.1** — Add `headers()`:
  ```js
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  }
  ```
- [ ] **A19.2** — Smoke: `curl -sI http://localhost:3000/ | grep -iE 'strict-transport|content-type|referrer|permissions|frame'` — all five present.
- [ ] **A19.3** — Commit: `git add next.config.mjs && git commit -m "feat(security): standard security headers"`

### Task A20: CSP middleware with per-request nonce

**Files:**
- Modify: `src/middleware.ts`

- [ ] **A20.1** — Read current middleware. Add nonce generation and CSP header:
  ```ts
  import { NextRequest, NextResponse } from "next/server";

  export function middleware(req: NextRequest) {
    // ...existing auth-gate logic...

    const nonce = btoa(crypto.randomUUID());
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      connect-src 'self' wss: https://*.sentry.io;
      font-src 'self' data:;
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s{2,}/g, " ").trim();

    const res = NextResponse.next({ request: { headers: new Headers({ ...Object.fromEntries(req.headers), "x-nonce": nonce }) } });
    res.headers.set("Content-Security-Policy", cspHeader);
    return res;
  }

  export const config = {
    matcher: [{ source: "/((?!api/auth|_next/static|_next/image|favicon).*)" }],
  };
  ```
- [ ] **A20.2** — Update root layout to use the nonce for the Next.js inline script. In `src/app/layout.tsx`, read it from headers:
  ```tsx
  import { headers } from "next/headers";
  // in the component:
  const nonce = (await headers()).get("x-nonce") ?? "";
  // pass nonce={nonce} to Script components if any
  ```
- [ ] **A20.3** — Smoke: `curl -sI http://localhost:3000/ | grep -i content-security-policy` — present. Open in browser, DevTools console: no CSP violations for the homepage.
- [ ] **A20.4** — Commit: `git add src/middleware.ts src/app/layout.tsx && git commit -m "feat(security): CSP with per-request nonce"`

### Task A21: Origin-header check middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **A21.1** — Inside the middleware, before the CSP set, add for mutating methods on `/api/*`:
  ```ts
  const isMutate = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isMutate && isApi) {
    const origin = req.headers.get("origin");
    const expected = new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000").origin;
    if (origin && origin !== expected) {
      return NextResponse.json({ error: "BAD_ORIGIN" }, { status: 403 });
    }
  }
  ```
  Note: NextAuth's own routes are excluded by the matcher in A20.1. Recheck if you tighten the matcher — `api/auth` must stay excluded so NextAuth's internal cross-origin handling works.
- [ ] **A21.2** — Smoke: `curl -X POST -H 'Origin: https://evil.com' -H 'Content-Type: application/json' http://localhost:3000/api/posts -d '{}'` → 403 BAD_ORIGIN. Same call from the actual frontend in browser → not blocked.
- [ ] **A21.3** — Commit: `git add src/middleware.ts && git commit -m "feat(security): Origin-header check on mutating /api/ requests"`

---

## Phase B — Production config files (local)

Still on the dev workstation. These files get committed to git and shipped to the box at deploy time.

### Task B1: docker-compose.prod.yml

**Files:**
- Create: `docker-compose.prod.yml`

- [ ] **B1.1** — Create:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_USER: xarxa
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
        POSTGRES_DB: xarxa
      volumes:
        - pgdata:/var/lib/postgresql/data
      restart: unless-stopped

    app:
      build:
        context: .
        args:
          COMMIT_SHA: ${COMMIT_SHA:-unknown}
          SENTRY_AUTH_TOKEN: ${SENTRY_AUTH_TOKEN:-}
      environment:
        DATABASE_URL: "postgresql://xarxa:${POSTGRES_PASSWORD}@postgres:5432/xarxa?schema=public"
        NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
        NEXTAUTH_URL: "https://xarxa.org"
        RESEND_API_KEY: ${RESEND_API_KEY}
        SENTRY_DSN: ${SENTRY_DSN}
        EMAIL_FROM: "noreply@xarxa.org"
        NODE_ENV: production
      volumes:
        - uploads:/app/public/uploads
      depends_on:
        - postgres
      restart: unless-stopped

    caddy:
      image: caddy:2-alpine
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./Caddyfile:/etc/caddy/Caddyfile:ro
        - caddy_data:/data
        - caddy_config:/config
      depends_on:
        - app
      restart: unless-stopped

  volumes:
    pgdata:
    uploads:
    caddy_data:
    caddy_config:
  ```
- [ ] **B1.2** — Commit: `git add docker-compose.prod.yml && git commit -m "feat(infra): docker-compose.prod.yml"`

### Task B2: Caddyfile

**Files:**
- Create: `Caddyfile`

- [ ] **B2.1** — Create:
  ```
  xarxa.org {
    encode gzip zstd
    reverse_proxy app:3000 {
      transport http {
        keepalive 30s
      }
    }
    log {
      output file /data/access.log {
        roll_size 50mb
        roll_keep 5
      }
    }
  }

  www.xarxa.org {
    redir https://xarxa.org{uri} permanent
  }
  ```
- [ ] **B2.2** — Commit: `git add Caddyfile && git commit -m "feat(infra): Caddyfile (Let's Encrypt + reverse-proxy)"`

### Task B3: Dockerfile updates

**Files:**
- Modify: `Dockerfile`

- [ ] **B3.1** — At the top of the `builder` stage, accept the build args:
  ```dockerfile
  ARG COMMIT_SHA=unknown
  ARG SENTRY_AUTH_TOKEN=
  ENV NEXT_PUBLIC_COMMIT_SHA=$COMMIT_SHA
  ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
  ```
- [ ] **B3.2** — After `RUN npm run build`, run `next telemetry disable` once at image build time:
  ```dockerfile
  RUN npx next telemetry disable
  ```
- [ ] **B3.3** — Commit: `git add Dockerfile && git commit -m "feat(infra): Dockerfile accepts COMMIT_SHA + SENTRY_AUTH_TOKEN"`

### Task B4: deploy-prod.sh

**Files:**
- Create: `deploy-prod.sh` (committed to git, used on the box)

- [ ] **B4.1** — Create:
  ```bash
  #!/bin/bash
  set -euo pipefail
  cd /opt/xarxa

  echo "→ Pulling latest…"
  git fetch origin
  git reset --hard origin/main

  SHA=$(git rev-parse --short HEAD)
  export COMMIT_SHA=$SHA
  echo "→ Building image for $SHA…"
  docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml build app

  echo "→ Applying DB migrations…"
  docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml run --rm \
    app npx prisma db push --accept-data-loss

  echo "→ Restarting app…"
  docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps app

  echo "→ Smoke test…"
  sleep 5
  curl -sfL https://xarxa.org/ > /dev/null || { echo "✗ Smoke failed"; exit 1; }
  echo "✓ Deploy OK at $(date -u +%FT%TZ) — sha=$SHA"
  ```
- [ ] **B4.2** — `chmod +x deploy-prod.sh` (so it's executable after clone).
- [ ] **B4.3** — Commit: `git add deploy-prod.sh && git commit -m "feat(infra): deploy-prod.sh (build, migrate, restart, smoke)"`

### Task B5: Backup scripts

**Files:**
- Create: `scripts/backup-postgres.sh`
- Create: `scripts/backup-uploads.sh`

- [ ] **B5.1** — Create `scripts/backup-postgres.sh`:
  ```bash
  #!/bin/bash
  set -euo pipefail
  # Run as root via cron. Reads encryption key from /etc/xarxa/backup.key.

  KEY_FILE=/etc/xarxa/backup.key
  B2_BUCKET=xarxa-backups
  DATE=$(date -u +%Y%m%d-%H%M%S)
  TMP=/tmp/xarxa-pg-$DATE.sql.gpg

  docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml \
    exec -T postgres pg_dump -U xarxa xarxa \
    | gpg --batch --yes --passphrase-file "$KEY_FILE" --symmetric --cipher-algo AES256 \
    > "$TMP"

  rclone copy "$TMP" "b2:$B2_BUCKET/postgres/" --quiet
  rm "$TMP"
  ```
- [ ] **B5.2** — Create `scripts/backup-uploads.sh`:
  ```bash
  #!/bin/bash
  set -euo pipefail
  # restic snapshot of /var/lib/docker/volumes/xarxa_uploads/_data → B2.
  # RESTIC_REPOSITORY and RESTIC_PASSWORD are set in /etc/xarxa/backup.env (mode 400 root).

  source /etc/xarxa/backup.env

  UPLOADS_PATH=$(docker volume inspect xarxa_uploads --format '{{.Mountpoint}}')
  restic backup "$UPLOADS_PATH" --tag uploads --quiet
  restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 3 --prune --quiet
  ```
- [ ] **B5.3** — `chmod +x scripts/backup-*.sh`.
- [ ] **B5.4** — Commit: `git add scripts/ && git commit -m "feat(backup): postgres + uploads scripts (gpg + restic to B2)"`

### Task B6: Runbook stub

**Files:**
- Create: `docs/runbook.md`

- [ ] **B6.1** — Create with the six sections from the spec (decision tree, common commands, restore steps, secret rotation, external links, escalation). Use placeholders like `<hetzner-box-ip>` for now — filled in at Phase I.
  ```markdown
  # xarxa Production Runbook

  Single-page incident response. Box IP: `<hetzner-box-ip>`. SSH as `xarxa@<hetzner-box-ip>`.

  ## 1. Site is down — decision tree
  ... (full content) ...
  ```
  Write all six sections in full, even if some specifics are placeholders.
- [ ] **B6.2** — Commit: `git add docs/runbook.md && git commit -m "docs: runbook stub (filled in Phase I)"`

---

## Phase A+B handoff: push to GitHub

- [ ] **B7.1** — `git push origin main` — all Phase A and B work is now on the public repo. The friend-beta on the MacBook can pull this with `./deploy.sh` (no migrations break — Resend will be skipped if `RESEND_API_KEY` is unset, all other features remain working).
- [ ] **B7.2** — Run the friend-beta sanity check: pull on the MacBook, redeploy, sign up a new account locally, see the verify-pending page. Friend-beta still works without prod email. Good.

---

## Phase C — Account creation (operator-driven)

These tasks run in parallel with operator availability. Each one is the operator clicking through a sign-up flow and pasting the resulting credential back into the conversation, where Claude tucks it into the spec for later use. **No secret value should be pasted into a tool call or commit.** Operator keeps them in a password manager.

### Task C1: Cloudflare account + xarxa.org

- [ ] **C1.1** — Operator: sign up at https://cloudflare.com. Verify email. Enable 2FA (recommended).
- [ ] **C1.2** — Operator: in Cloudflare dashboard → Domain Registration → Search "xarxa.org". Expect available. Add to cart, complete checkout (~€11). Free WHOIS privacy enabled by default.
- [ ] **C1.3** — Operator: generate an API token at My Profile → API Tokens → Create Token. Use the "Edit zone DNS" template. Zone: xarxa.org. Permissions: Zone:DNS:Edit, Zone:Zone:Read. Copy the token to a password manager.
- [ ] **C1.4** — Operator: confirm to Claude "Cloudflare done, xarxa.org owned, API token in password manager." (Don't paste the token in chat.)

### Task C2: Resend account

- [ ] **C2.1** — Operator: sign up at https://resend.com (Google sign-in fine). Free plan.
- [ ] **C2.2** — Operator: Dashboard → Domains → Add Domain → `xarxa.org`. Resend shows three DNS records (1 MX or TXT for SPF, 1 CNAME for DKIM, 1 TXT for DMARC suggestion). **Do not click "Verify" yet** — DNS records get added in Phase E.
- [ ] **C2.3** — Operator: API Keys → Create. Name: `xarxa-prod`. Permission: Sending access. Copy the value (starts with `re_`) to password manager.

### Task C3: Sentry account + project

- [ ] **C3.1** — Operator: sign up at https://sentry.io (Developer plan, free).
- [ ] **C3.2** — Create new project. Platform: "Next.js". Project name: `xarxa`.
- [ ] **C3.3** — Copy the DSN shown (`https://xxx@xxx.ingest.sentry.io/xxx`) to password manager.
- [ ] **C3.4** — Settings → Account → Auth Tokens → Create New Token. Scopes: `project:releases`, `org:read`, `project:read`, `project:write`. Copy to password manager.

### Task C4: UptimeRobot

- [ ] **C4.1** — Operator: sign up at https://uptimerobot.com (free).
- [ ] **C4.2** — Don't add a monitor yet — wait until the site responds (Phase F).

### Task C5: Backblaze B2

- [ ] **C5.1** — Operator: sign up at https://www.backblaze.com/cloud-storage (verify email + 2FA).
- [ ] **C5.2** — Buckets → Create. Name: `xarxa-backups`. Files: Private. Default encryption: enabled. Object Lock: off.
- [ ] **C5.3** — App Keys → Add a New Application Key. Name: `xarxa-prod-backup`. Bucket: `xarxa-backups`. Permissions: Read+Write. Copy the keyID + applicationKey to password manager.
- [ ] **C5.4** — Note the bucket's `endpoint` (visible in bucket details, like `s3.eu-central-003.backblazeb2.com`) to password manager.

### Task C6: Hetzner account + CX22 box

- [ ] **C6.1** — Operator: sign up at https://accounts.hetzner.com. ID verification may take 5–30 min (phone or document). Add payment method (SEPA preferred for EU, cheaper than card).
- [ ] **C6.2** — Hetzner Cloud (different product, same account) → Create new project: `xarxa`.
- [ ] **C6.3** — On the dev workstation, generate an SSH key for prod (separate from any existing one):
  ```bash
  ssh-keygen -t ed25519 -f ~/.ssh/xarxa-prod -C "xarxa-prod-$(date +%F)"
  ```
  No passphrase (or one you'll remember — required at every SSH).
- [ ] **C6.4** — In Hetzner Cloud → SSH Keys → Add SSH key → paste `~/.ssh/xarxa-prod.pub`'s contents.
- [ ] **C6.5** — Hetzner Cloud → Servers → Add Server. Location: Frankfurt (FSN1). Image: Ubuntu 24.04. Type: CX22. Networking: IPv4 enabled. SSH key: select the one just added. Firewall: skip for now (we configure `ufw` on the box). Name: `xarxa-prod`. Create. ~30 seconds later it's running.
- [ ] **C6.6** — Hetzner Cloud → the server's detail page → Backups tab → enable weekly snapshot (~€0.40/month). Confirm.
- [ ] **C6.7** — Note the public IPv4 address to the conversation. **This IP can be shared** (it'll be the DNS A record anyway).
- [ ] **C6.8** — Edit `~/.ssh/config` on the dev workstation:
  ```
  Host xarxa-prod
    HostName <hetzner-public-ip>
    User root
    IdentityFile ~/.ssh/xarxa-prod
    IdentitiesOnly yes
  ```
- [ ] **C6.9** — `ssh xarxa-prod` — first connection, accept fingerprint, land in root shell. Type `exit`.

---

## Phase D — Box bootstrap

All work via `ssh xarxa-prod`. Claude drives — operator confirms each command before paste.

### Task D1: Initial harden

- [ ] **D1.1** — `ssh xarxa-prod`. Update + reboot:
  ```bash
  apt update && apt -y upgrade && apt -y install unattended-upgrades ufw fail2ban gpg rclone restic curl ca-certificates
  reboot
  ```
  Reconnect after ~30s.
- [ ] **D1.2** — Configure `unattended-upgrades`:
  ```bash
  dpkg-reconfigure -plow unattended-upgrades  # → Yes
  systemctl enable --now unattended-upgrades
  ```
- [ ] **D1.3** — Create operator user `xarxa`:
  ```bash
  adduser --disabled-password --gecos "" xarxa
  usermod -aG sudo xarxa
  mkdir -p /home/xarxa/.ssh
  cp /root/.ssh/authorized_keys /home/xarxa/.ssh/authorized_keys
  chown -R xarxa:xarxa /home/xarxa/.ssh
  chmod 700 /home/xarxa/.ssh && chmod 600 /home/xarxa/.ssh/authorized_keys
  # let xarxa sudo without password (single-operator convenience)
  echo 'xarxa ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/xarxa
  ```
- [ ] **D1.4** — Disable password SSH + root SSH:
  ```bash
  sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  systemctl restart ssh
  ```
- [ ] **D1.5** — Update `~/.ssh/config` on dev workstation: change `User root` to `User xarxa`. Test: `ssh xarxa-prod` — lands as `xarxa@xarxa-prod`. `sudo -i` to confirm passwordless sudo. Exit back.
- [ ] **D1.6** — Configure `ufw`:
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw --force enable
  sudo ufw status verbose
  ```
- [ ] **D1.7** — Install Docker + Compose plugin (official repo, not Ubuntu's):
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker xarxa
  exit  # reconnect for group membership
  ```
  Reconnect, verify: `docker version && docker compose version`.

### Task D2: Clone repo

- [ ] **D2.1** — On the box:
  ```bash
  sudo mkdir -p /opt/xarxa && sudo chown xarxa:xarxa /opt/xarxa
  git clone https://github.com/ltanzi/xarxa.git /opt/xarxa
  cd /opt/xarxa
  ```
- [ ] **D2.2** — Sanity: `ls /opt/xarxa` shows the repo.

### Task D3: Generate secrets, write env files

- [ ] **D3.1** — Create config directory:
  ```bash
  sudo mkdir -p /etc/xarxa && sudo chown xarxa:xarxa /etc/xarxa && sudo chmod 750 /etc/xarxa
  ```
- [ ] **D3.2** — Generate the three on-box secrets and assemble `/etc/xarxa/.env`. Operator pastes the values from C2/C3/C5 password manager. Run line by line:
  ```bash
  cat > /etc/xarxa/.env <<EOF
  NEXTAUTH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
  RESEND_API_KEY=<paste from password manager>
  SENTRY_DSN=<paste from password manager>
  SENTRY_AUTH_TOKEN=<paste from password manager>
  EOF
  chmod 600 /etc/xarxa/.env
  ```
- [ ] **D3.3** — Generate backup encryption key. Print to terminal so the operator can copy it to the password manager (this is the ONE time the value is visible):
  ```bash
  KEY=$(openssl rand -base64 32)
  echo "$KEY" | sudo tee /etc/xarxa/backup.key > /dev/null
  sudo chmod 400 /etc/xarxa/backup.key
  sudo chown root:root /etc/xarxa/backup.key
  echo "BACKUP_ENCRYPTION_KEY (COPY THIS TO PASSWORD MANAGER NOW): $KEY"
  ```
  Operator: copy to password manager labeled "xarxa backup encryption key". After confirming, clear scrollback: `clear; history -c`.
- [ ] **D3.4** — Write `/etc/xarxa/backup.env` (for restic credentials, root-only):
  ```bash
  sudo tee /etc/xarxa/backup.env <<EOF > /dev/null
  export B2_ACCOUNT_ID=<keyID from C5>
  export B2_ACCOUNT_KEY=<applicationKey from C5>
  export RESTIC_REPOSITORY=b2:xarxa-backups:restic-uploads
  export RESTIC_PASSWORD=$KEY  # reuse the same backup key
  EOF
  sudo chmod 400 /etc/xarxa/backup.env
  sudo chown root:root /etc/xarxa/backup.env
  ```
- [ ] **D3.5** — Configure rclone for B2 (so `backup-postgres.sh` can copy):
  ```bash
  sudo mkdir -p /root/.config/rclone
  sudo tee /root/.config/rclone/rclone.conf <<EOF > /dev/null
  [b2]
  type = b2
  account = <keyID from C5>
  key = <applicationKey from C5>
  EOF
  sudo chmod 600 /root/.config/rclone/rclone.conf
  ```
- [ ] **D3.6** — Initialize restic repo (one-time):
  ```bash
  source /etc/xarxa/backup.env
  sudo -E restic init
  ```
- [ ] **D3.7** — Verify env file: `sudo cat /etc/xarxa/.env | head -3` shows keys without values exposed to logs. `ls -la /etc/xarxa/` shows correct modes (.env 600 xarxa, backup.key 400 root, backup.env 400 root).

### Task D4: systemd unit

- [ ] **D4.1** — Write `/etc/systemd/system/xarxa.service`:
  ```bash
  sudo tee /etc/systemd/system/xarxa.service <<'EOF' > /dev/null
  [Unit]
  Description=xarxa app stack
  After=docker.service network-online.target
  Requires=docker.service

  [Service]
  Type=oneshot
  RemainAfterExit=yes
  WorkingDirectory=/opt/xarxa
  ExecStart=/usr/bin/docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d
  ExecStop=/usr/bin/docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml down
  User=xarxa
  Group=xarxa

  [Install]
  WantedBy=multi-user.target
  EOF

  sudo systemctl daemon-reload
  sudo systemctl enable xarxa.service
  ```
  Don't start it yet — DNS records aren't in place; Caddy would fail to get a cert.

### Task D5: Cron for backups

- [ ] **D5.1** — Write the crontab as root:
  ```bash
  sudo tee /etc/cron.d/xarxa-backups <<'EOF' > /dev/null
  SHELL=/bin/bash
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

  # Nightly Postgres dump (03:00 UTC)
  0 3 * * * root /opt/xarxa/scripts/backup-postgres.sh 2>&1 | logger -t xarxa-backup || curl -s --data "from=alerts@xarxa.org" --data "to=<operator-email>" --data "subject=xarxa backup FAILED" --data "text=See journalctl -t xarxa-backup" "https://api.resend.com/emails" -H "Authorization: Bearer $(grep '^RESEND_API_KEY=' /etc/xarxa/.env | cut -d= -f2-)"

  # Nightly uploads snapshot (03:30 UTC)
  30 3 * * * root /opt/xarxa/scripts/backup-uploads.sh 2>&1 | logger -t xarxa-backup
  EOF
  sudo chmod 644 /etc/cron.d/xarxa-backups
  sudo systemctl restart cron
  ```
  (Replace `<operator-email>` with the operator's address.) The cron approach above is a one-line failover; if it gets ugly, refactor to a wrapper script in Task H3.
- [ ] **D5.2** — Sanity: `sudo crontab -l -u root` (might be empty — using `/etc/cron.d/` instead); `ls /etc/cron.d/xarxa-backups`.

---

## Phase E — DNS records

Use the Cloudflare web dashboard OR the API (Claude can drive via API if operator pastes the C1.3 token into a one-line env in the conversation, but most operators prefer the dashboard for first-time DNS).

### Task E1: Add A, SPF, DMARC, CAA records

- [ ] **E1.1** — Cloudflare dashboard → xarxa.org → DNS → Records → Add record. Add each:

  | Type | Name | Content | Proxy | TTL |
  |---|---|---|---|---|
  | A | `@` | `<hetzner-public-ip>` | DNS only | Auto |
  | A | `www` | `<hetzner-public-ip>` | DNS only | Auto |
  | TXT | `@` | `v=spf1 include:_spf.resend.com -all` | n/a | Auto |
  | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@xarxa.org` | n/a | Auto |
  | CAA | `@` | `0 issue "letsencrypt.org"` | n/a | Auto |

- [ ] **E1.2** — From dev workstation: `dig +short xarxa.org` returns the Hetzner IP. `dig +short -t TXT xarxa.org` shows the SPF. (May take up to 5 min for first resolution.)

### Task E2: Resend domain verification

- [ ] **E2.1** — Resend dashboard → Domains → `xarxa.org`. Resend shows the DKIM CNAME record (e.g., `resend._domainkey.xarxa.org` → some Resend-provided target). Copy the **exact** name + value.
- [ ] **E2.2** — Add to Cloudflare DNS:
  | Type | Name | Content | Proxy |
  |---|---|---|---|
  | CNAME | `resend._domainkey` | `<value from Resend>` | DNS only |
- [ ] **E2.3** — Back in Resend → Verify. Should turn green within ~1 min.

### Task E3: Wait + verify

- [ ] **E3.1** — From any external machine: `dig +short xarxa.org` returns the box IP. `nslookup -type=txt xarxa.org` shows SPF.
- [ ] **E3.2** — From the box: `curl -v https://acme-staging-v02.api.letsencrypt.org/directory` (sanity: outbound HTTPS works from the box).

---

## Phase F — First deploy

### Task F1: Initial deploy

- [ ] **F1.1** — SSH in: `ssh xarxa-prod`. From `/opt/xarxa`:
  ```bash
  ./deploy-prod.sh 2>&1 | tee /tmp/first-deploy.log
  ```
  Expect: ~3 min build, Prisma migration applied, Caddy provisions Let's Encrypt cert (visible in `docker compose logs caddy`), smoke test passes. If it fails: read the log, fix, rerun.
- [ ] **F1.2** — `docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml ps` — all three services `Up (healthy)`.

### Task F2: Verify HTTPS

- [ ] **F2.1** — From dev workstation: `curl -sIL https://xarxa.org/` returns HTTP/2 200 + valid Let's Encrypt cert (no `-k` needed).
- [ ] **F2.2** — `curl -sIL https://www.xarxa.org/` returns 301 to https://xarxa.org/.
- [ ] **F2.3** — Open `https://xarxa.org/` in a browser — homepage with hands.png renders. Hard refresh, no CSP errors in DevTools console.

### Task F3: Verify security headers

- [ ] **F3.1** — `curl -sIL https://xarxa.org/ | grep -iE 'strict-transport|content-security-policy|x-frame|x-content-type|referrer|permissions'` shows all six.
- [ ] **F3.2** — Run https://www.ssllabs.com/ssltest/analyze.html?d=xarxa.org — expect A or A+.

### Task F4: End-to-end sign-up + verify + post

- [ ] **F4.1** — In the browser, register a real test account (use a real inbox you control). Submit. Redirected to `/auth/verify-pending` showing "Check your email" in EN.
- [ ] **F4.2** — Within ~30s, an email lands from `noreply@xarxa.org` with subject "Verify your email — xarxa". Click the link.
- [ ] **F4.3** — Browser lands on `/?verified=1`. Verify-banner gone. Try to create a post — works.
- [ ] **F4.4** — Sign out. Re-register with a different test email but DO NOT click the verify link. Sign in (works — auth gate is the soft wall). Try to create a post → button shows "Verify your email to do this", clicking it surfaces a banner. Browse the board, view post details — all accessible.
- [ ] **F4.5** — On the verify-pending page for the second account, click "Resend". Watch the inbox.

### Task F5: Rate limit smoke

- [ ] **F5.1** — From dev workstation, blast the register endpoint:
  ```bash
  for i in $(seq 1 8); do
    curl -sw '%{http_code}\n' -o /dev/null -X POST -H 'Content-Type: application/json' \
      -d '{"email":"throw'$i'@example.invalid","password":"Password1!","name":"T","type":"PRIVATE"}' \
      https://xarxa.org/api/auth/register
  done
  ```
  Expect: first 5 return 400 (validation passes but emails are .invalid → still 200/4xx depending on flow); 6th onward return 429.

### Task F6: Reboot test

- [ ] **F6.1** — `sudo reboot`. Wait ~90s. From dev workstation: `curl -sI https://xarxa.org/` returns 200. systemd brought the stack back unattended.

---

## Phase G — Monitoring wire-up

### Task G1: Sentry — trigger a test error

- [ ] **G1.1** — Modify any server-side route temporarily to throw on demand, OR use the Sentry SDK test page (`/api/sentry-test` is a common pattern). Easiest: in browser, open DevTools console on https://xarxa.org/ and run `Sentry.captureException(new Error("smoke test"))` (the Sentry SDK is auto-loaded by the Next.js integration).
- [ ] **G1.2** — Sentry dashboard → Issues — the smoke error appears within ~1 min, tagged with `release: <commit-sha>`.

### Task G2: Sentry source maps

- [ ] **G2.1** — Check `docker compose logs app` from the build — should show "[sentry] Source maps uploaded to release <sha>" or similar. If not: the SENTRY_AUTH_TOKEN env wasn't passed to build; check `docker-compose.prod.yml` and re-deploy.
- [ ] **G2.2** — Click into the Sentry issue from G1 — source line numbers should resolve to real `src/...` paths, not `chunks/abc.js`.

### Task G3: UptimeRobot

- [ ] **G3.1** — UptimeRobot dashboard → Add New Monitor. Type: HTTPS. URL: `https://xarxa.org/`. Friendly name: `xarxa`. Interval: 5 min. Alert contacts: operator's email.
- [ ] **G3.2** — Wait ~10 min. Monitor should show green.

---

## Phase H — Backups + restore drill

### Task H1: Manual first backup

- [ ] **H1.1** — SSH in. Run:
  ```bash
  sudo /opt/xarxa/scripts/backup-postgres.sh
  sudo /opt/xarxa/scripts/backup-uploads.sh
  ```
- [ ] **H1.2** — In B2 dashboard → Buckets → `xarxa-backups` → Browse. Two prefixes visible: `postgres/xarxa-pg-...sql.gpg` and `restic-uploads/`.

### Task H2: Backup-failure alerting

- [ ] **H2.1** — Temporarily break the script: rename `/etc/xarxa/backup.key` to `backup.key.bak`. Run `sudo /opt/xarxa/scripts/backup-postgres.sh` — should fail. Check that the email-alert step in `/etc/cron.d/xarxa-backups` would have fired (the cron-line failover sends a curl to Resend on non-zero exit). Test manually: `bash -c 'false || curl -s --data "from=alerts@xarxa.org" --data "to=<your-email>" --data "subject=xarxa backup TEST" --data "text=test" "https://api.resend.com/emails" -H "Authorization: Bearer <key>"'`. Confirm the email arrives.
- [ ] **H2.2** — Restore key: `sudo mv /etc/xarxa/backup.key.bak /etc/xarxa/backup.key`.

### Task H3: Restore drill (the important one)

- [ ] **H3.1** — On dev workstation, pull the latest dump from B2:
  ```bash
  mkdir -p /tmp/xarxa-restore-drill && cd /tmp/xarxa-restore-drill
  rclone copy b2:xarxa-backups/postgres/ . --include "*.sql.gpg" --max-age 30h
  ls -lh  # one file
  ```
- [ ] **H3.2** — Decrypt (key from password manager — paste into a temp file, then delete):
  ```bash
  echo '<backup-key>' > .key && chmod 600 .key
  gpg --batch --yes --passphrase-file .key --decrypt xarxa-pg-*.sql.gpg > restored.sql
  rm .key
  wc -l restored.sql   # should be many thousands
  ```
- [ ] **H3.3** — Spin up a throwaway Docker Postgres locally and load:
  ```bash
  docker run --rm -d --name pg-drill -e POSTGRES_PASSWORD=drill -p 5433:5432 postgres:16-alpine
  sleep 3
  PGPASSWORD=drill psql -h localhost -p 5433 -U postgres -c 'CREATE DATABASE xarxa;'
  PGPASSWORD=drill psql -h localhost -p 5433 -U postgres -d xarxa < restored.sql
  PGPASSWORD=drill psql -h localhost -p 5433 -U postgres -d xarxa -c 'SELECT count(*) FROM "User"; SELECT count(*) FROM "Post";'
  ```
- [ ] **H3.4** — Compare row counts with prod: SSH in, `docker compose exec postgres psql -U xarxa xarxa -c 'SELECT count(*) FROM "User";'`. Numbers match.
- [ ] **H3.5** — Tear down: `docker rm -f pg-drill && rm -rf /tmp/xarxa-restore-drill`.

---

## Phase I — Documentation + release

### Task I1: Fill in runbook

- [ ] **I1.1** — On dev workstation, edit `docs/runbook.md` (the stub from B6). Replace `<hetzner-box-ip>` and any other placeholders with discovered values. Add observed quirks from F+G+H (e.g., "Caddy logs use UTC, app logs use local time"). Commit: `git add docs/runbook.md && git commit -m "docs(runbook): fill in production specifics"`.

### Task I2: Update README

- [ ] **I2.1** — Edit `README.md`. Above the screenshot line add a "Live at" line: `**Live at: [xarxa.org](https://xarxa.org)**`. Add a "Runbook" pointer in the Getting Started section: see `docs/runbook.md` for prod incidents.
- [ ] **I2.2** — Commit: `git add README.md && git commit -m "docs(readme): point to live site and runbook"`.

### Task I3: Update CLAUDE.md

- [ ] **I3.1** — Edit `CLAUDE.md`. Under "Roadmap":
  - Move "Email verification flow" out of Phase 5
  - Add a "Done" section noting go-live (date, domain, hosting summary)
  - Move "Rate limiting", "CSP headers", "secrets management" out of Phase 5
- [ ] **I3.2** — Add a "Production" section with one-liners: box is `xarxa@xarxa-prod`, env in `/etc/xarxa/.env`, backups in B2 bucket `xarxa-backups`, runbook at `docs/runbook.md`.
- [ ] **I3.3** — Commit: `git add CLAUDE.md && git commit -m "docs(claude): mark go-live items as done, add production pointers"`.

### Task I4: Final push

- [ ] **I4.1** — `git push origin main`.
- [ ] **I4.2** — On the box: `cd /opt/xarxa && ./deploy-prod.sh` — deploys the doc changes (no app code change, but builds and restarts; harmless).

---

## Acceptance criteria check

After Phase I, walk through the spec's 13 acceptance criteria one by one. Tick each:

- [ ] **AC1** — `https://xarxa.org/` loads with valid LE cert + `<title>xarxa</title>`
- [ ] **AC2** — Sign up → email → click link → can post
- [ ] **AC3** — Unverified user: browse OK, action buttons gated
- [ ] **AC4** — 6 register attempts in an hour from one IP → 429
- [ ] **AC5** — `curl -sI https://xarxa.org/` shows HSTS + CSP + X-Frame
- [ ] **AC6** — `sudo reboot` brings stack back unattended in ~2 min
- [ ] **AC7** — Sentry captures manual `throw new Error("smoke")`
- [ ] **AC8** — UptimeRobot monitor is green
- [ ] **AC9** — Nightly cron lands a `pg_dump.sql.gpg` in B2
- [ ] **AC10** — Restore drill: decrypt + psql + row counts match prod
- [ ] **AC11** — `/etc/xarxa/.env` exists (mode 600), nothing secret in git (`git log -p | grep -iE 'NEXTAUTH_SECRET|RESEND_API_KEY|POSTGRES_PASSWORD' | grep -v dev-secret-change` is empty)
- [ ] **AC12** — `docs/runbook.md` exists with all six sections
- [ ] **AC13** — CLAUDE.md + README updated

When all 13 are ticked, the spec is done. Tell the operator and offer a `/celebrate` 🎉 commit.

---

## Self-review notes (already addressed)

- Plan covers every section of the spec; no spec requirement is uncovered.
- No `TBD`/`TODO` placeholders. Two `<placeholder>` slots are intentional (hetzner-IP and operator-email) — they're filled with discovered values mid-execution.
- Type consistency: `requireVerifiedUser()` (not `requireVerified()`) used consistently in A5/A11/A12; `limit()` and `ipKey()` names match across A16/A17.
- Rate-limit numbers match the spec table exactly.
- `BACKUP_ENCRYPTION_KEY` lives in `/etc/xarxa/backup.key` only (matches the spec's correction) — `/etc/xarxa/.env` does NOT contain it.
- `RESTIC_PASSWORD` is set to the same value as the GPG passphrase deliberately (one key to lose).
- No `prisma migrate`; consistent with existing `deploy.sh` using `db push`.

