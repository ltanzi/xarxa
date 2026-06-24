# xarxa — Go-Live Foundation Design

**Date:** 2026-06-24
**Status:** Draft, awaiting user review
**Scope:** Move xarxa from a MacBook + Cloudflare-tunnel friend-beta to a real production deployment on a public domain, with email-verified accounts and the minimum security/monitoring posture required before strangers (not just friends) start using it.

---

## Goal and non-goals

**Goal.** A community-scale (≤100 active users) production deployment of xarxa under a real domain, owned and operated by one person (l.tanzi) at a hard budget ceiling of €120/year, with:

- Real HTTPS on a permanent URL
- Email-verified accounts (soft-wall enforcement)
- Off-box encrypted backups with a tested restore path
- Error + uptime monitoring that pages the operator when things break
- The minimum security hardening required before exposing the app to the open internet

**Non-goals (explicitly deferred, will be follow-up specs):**

- Password reset by email
- Reports / blocks / content moderation
- Full Phase 5 security audit (path-traversal hardening, audit logging, MFA, account lockout)
- SEO / Open Graph / sitemap
- E2E and integration test suite
- CI/CD via GitHub Actions
- Staging environment
- Product analytics (Plausible / PostHog)
- Privacy policy and Terms pages (content task; required before genuinely public launch but out of this infra spec)

---

## Constraints

- **Budget:** €60/year comfortable, €120/year ceiling. Drives every hosting and tooling decision.
- **Operator:** one person, limited prior ops experience, comfortable with "follow a runbook" but not "design a runbook from scratch."
- **Stack:** Next.js 14 with custom `server.ts` (Socket.io). Long-lived WebSocket connections rule out serverless platforms.
- **Existing code:** Already Dockerized (multi-stage `Dockerfile`); local-dev `docker-compose.yml` works. The work is around it, not in it.

---

## Decisions

### Hosting: Hetzner Cloud CX22

- Ubuntu 24.04 LTS, Frankfurt (FSN1) datacenter (~20ms latency from Spain)
- €4.51/month (~€54/year). Hourly prorated billing — destroy at any time, no penalty.
- 4 GB RAM / 2 vCPU / 40 GB SSD — overspecced for friend-beta scale, gives years of headroom.
- Single non-root sudoer user named `xarxa`, SSH key auth only, password auth disabled.
- `ufw` firewall: only ports 22 (SSH), 80 (HTTP→HTTPS redirect), 443 (HTTPS) open. Postgres port 5432 NOT exposed.
- `unattended-upgrades` enabled day one — applies OS security patches nightly.

**Considered and rejected:**

- **Fly.io** — ~€145/year all-in (app + self-hosted Postgres machine + volume); within stretch ceiling but ~2× Hetzner with no comparable cost-predictability win. Fly removed their free tier in late 2024 and dropped managed Postgres, so the "no ops" story is weaker than it was. Documented as the natural migration target if Hetzner maintenance becomes a drag.
- **Railway / Render managed PaaS** — managed Postgres alone (~$7/month) blows the budget. Free tiers spin down, which is incompatible with Socket.io.
- **VPS at DigitalOcean** — slightly more expensive than Hetzner at the same RAM tier, no built-in snapshot-backup feature.

**Migration path away from Hetzner if needed:** `pg_dump` → `pg_restore` to Fly Postgres app, `rsync public/uploads/` to a Fly volume, `flyctl launch` reuses the existing Dockerfile unchanged, swap Cloudflare A record. ~1 evening. Sunk cost on Hetzner is hourly-prorated, ~€2 worst case.

### Domain: xarxa.org

- Registered at Cloudflare Registrar (at-cost pricing, ~€11/year, free WHOIS privacy)
- `.org` chosen over `.cat` (registrar friction + €18–25/yr) and `.com` (generic, no signal). `.org` reads "community / non-profit," works in any language.
- Cloudflare-only DNS provider — no third party.

### TLS and DNS topology

- TLS terminates at **Caddy on the box**, which fetches Let's Encrypt certificates directly. Auto-renewal every 60 days.
- Cloudflare DNS in **DNS-only mode (gray cloud)** for day one. Proxied mode is a one-click toggle later if DDoS becomes a concern; deferred because the proxy's 100-second idle timeout adds Socket.io reconnect noise.
- DNS records:

  | Type | Name | Value | Purpose |
  |---|---|---|---|
  | A | `@` | Hetzner public IP | The site |
  | A | `www` | Hetzner public IP | 301 redirected to apex by Caddy |
  | TXT | `@` | `v=spf1 include:_spf.resend.com -all` | SPF for Resend sending |
  | CNAME | `resend._domainkey` | (provided by Resend at verify) | DKIM |
  | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@xarxa.org` | DMARC, observe-only |
  | CAA | `@` | `0 issue "letsencrypt.org"` | Restrict cert issuance to Let's Encrypt |

### Email provider: Resend

- Free tier (3,000/month, 100/day) covers friend-beta with several orders of magnitude headroom
- DKIM, SPF, DMARC records added at the apex domain (above) so From addresses can be clean: `hello@xarxa.org`, `noreply@xarxa.org`
- React Email templates for full JSX template authoring with the same i18n approach as the rest of the app
- No receiving mailbox — sending only. Receiving at `@xarxa.org` is a separate future task.

### Email verification: soft wall

Unverified users can browse and read but cannot post, express interest, or chat. The choice over hard-wall (block sign-in entirely until verified) and pure-nag (works fully unverified): the trust model for a service-exchange community is "I will meet this person to receive help," so the *interaction* needs a real email, not the *browsing*.

### Architecture topology

```
                       ┌──────────────────────────────────────┐
                       │  Cloudflare (DNS, edge, DDoS shield) │
                       │  xarxa.org  →  A: <hetzner public IP>│
                       └──────────────────┬───────────────────┘
                                          │ HTTPS :443
                                          ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Hetzner CX22 (Ubuntu 24.04 LTS, Frankfurt)                   │
   │                                                               │
   │  ┌──────────┐         ┌────────────────┐    ┌──────────────┐ │
   │  │  Caddy   │  :3000  │  xarxa (Node)  │    │  Postgres 16 │ │
   │  │  TLS     │ ──────► │  Next.js +     │ ──►│  in Docker   │ │
   │  │  reverse │         │  Socket.io     │    │  volume:     │ │
   │  │  proxy   │         │  server.ts     │    │  pgdata      │ │
   │  └──────────┘         └────────────────┘    └──────────────┘ │
   │      :80,:443             :3000 (internal)     :5432 (intern.)│
   │                                                               │
   │  systemd: xarxa.service  →  docker compose up                 │
   │  ufw firewall: only 22, 80, 443 open                          │
   │  unattended-upgrades on (auto OS security patches nightly)    │
   └──────────────────────────────────────────────────────────────┘
                                          │
                                          │ nightly cron
                                          ▼
                       ┌──────────────────────────────────────┐
                       │  Backblaze B2 (free tier)            │
                       │  - pg_dump (gpg-encrypted)           │
                       │  - public/uploads/ (restic)          │
                       └──────────────────────────────────────┘
```

**Choices made:**

- **One box, not a cluster.** Friend-beta scale fits in 4 GB RAM. Vertical scaling later is one Hetzner click.
- **Postgres in Docker on the same box, not a managed DB.** Saves €5–7/month. Backups (below) cover the durability story.
- **Caddy, not Nginx.** Automatic Let's Encrypt with three lines of config.
- **systemd manages `docker compose`,** so the stack starts on reboot.
- **`xarxa.org` resolved via DNS-only.** Cert is fetched by Caddy directly from Let's Encrypt.

---

## Component-by-component design

### 1. App container (existing Dockerfile, two small additions)

The current multi-stage `Dockerfile` produces a standalone Next.js + Socket.io image. It already runs the compiled `server.ts`. Two additions for go-live:

- Accept a `COMMIT_SHA` build arg and expose it as `NEXT_PUBLIC_COMMIT_SHA` so Sentry tags releases (§12)
- Run `npx @sentry/wizard@latest` once to add the source-map upload step at build time (auth via `SENTRY_AUTH_TOKEN` build arg, also supplied by `deploy-prod.sh`)

No structural changes to the multi-stage layout.

### 2. Production compose stack — new file `docker-compose.prod.yml`

Separate from the local-dev `docker-compose.yml`. Differences:

- All secrets passed via `${VAR}` references, never inline. Read from `/etc/xarxa/.env` via `--env-file`.
- App container has no `ports:` published to host — Caddy reaches it via the internal Docker network.
- Postgres container has no `ports:` published either. Only reachable from app container.
- Persistent volumes: `pgdata` (database), `uploads` (mounted into app at `/app/public/uploads`).
- New service: `caddy` (Caddy 2 alpine image) — owns ports 80 + 443, terminates TLS, reverse-proxies `/` to app, proxies WebSocket upgrades for `/socket.io/`.
- New file: `Caddyfile` — declares the `xarxa.org` site, automatic Let's Encrypt cert, `www.xarxa.org` 301 redirect.
- All containers `restart: unless-stopped`.

### 3. systemd unit — new file `/etc/systemd/system/xarxa.service`

```
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

[Install]
WantedBy=multi-user.target
```

Enabled at provision time, so the stack starts on reboot.

### 4. Email verification — Prisma schema changes

Adds the conventional NextAuth `VerificationToken` table and an `emailVerified` column on `User`, so existing tooling and idioms apply.

```prisma
model User {
  // ... existing fields ...
  emailVerified  DateTime?   // null = unverified; timestamp = verified at
}

model VerificationToken {
  identifier  String     // the user's email
  token       String     @unique  // long opaque random string, stored hashed (sha-256)
  expires     DateTime
  @@unique([identifier, token])
}
```

Migration backfills `emailVerified = now()` for all rows that exist before the deploy, so no demo or beta-user accounts get locked out:

```sql
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;
```

### 5. Email verification — application changes

**New files:**

- `src/lib/email.ts` — Resend client wrapper, `sendVerificationEmail(email, locale, plainToken)`, `sendWelcomeEmail()`
- `src/emails/VerifyEmail.tsx` — React Email template, accepts `locale` prop, copy lives in EN/ES/CA
- `src/emails/Welcome.tsx` — optional post-verification welcome
- `src/app/api/auth/verify-email/route.ts` — `GET ?token=...` → mark verified, delete token row, 302 to `/`
- `src/app/api/auth/resend-verification/route.ts` — `POST { email }`, rate-limited
- `src/app/auth/verify-pending/page.tsx` — "Check your email" landing page shown immediately after sign-up
- `src/components/VerifyEmailBanner.tsx` — banner shown sitewide when `session.user.emailVerified == null`

**Modified files:**

- `src/app/api/auth/register/route.ts` — create user with `emailVerified = null`, generate 32-byte URL-safe random token, hash with sha-256, write `VerificationToken` row with 24h expiry, send email via Resend, return 200, client redirects to `/auth/verify-pending`
- `src/lib/auth-utils.ts` — new `requireVerifiedUser()` helper. On 403 returns `{ error: "EMAIL_NOT_VERIFIED" }` so the client can show a verify-prompt
- `src/app/api/posts/route.ts` (`POST`) — wrap with `requireVerifiedUser()`
- `src/app/api/connections/route.ts` (`POST`) — wrap with `requireVerifiedUser()`
- `server.ts` Socket.io `send-message` handler — reject if `user.emailVerified == null`
- `src/lib/auth.ts` — Google OAuth callback sets `emailVerified = now()` on first sign-in (Google has already verified)
- `src/i18n/locales/{en,es,ca}.json` — add `verification.*` and `email.*` keys

**Flow:**

1. User POSTs `/api/auth/register` with email + password
2. Server creates user with `emailVerified = null`, generates token, sends email
3. Client redirects to `/auth/verify-pending`
4. User clicks link in email → `GET /api/auth/verify-email?token=...`
5. Server hashes incoming token, looks up `VerificationToken` row, checks not expired, sets `User.emailVerified = now()`, deletes the token row, 302 to `/`
6. The verify-banner disappears, gated buttons activate

**Edge cases addressed:**

- Expired token → `/verify-pending` page offers a "Resend" button (rate-limited)
- Already-used token → same as expired (row was deleted on use)
- Verified user clicking an old link → 200 "already verified," redirect home
- Google OAuth sign-ups → `emailVerified` set automatically on first OAuth callback, no email sent
- Email send fails (Resend down or DNS misconfigured) → user is created anyway, Sentry captures the error, `/verify-pending` surfaces a "couldn't send — try resend" affordance
- All emails rendered in `user.preferredLanguage` if set, else EN

### 6. Secrets

Application secrets live ONLY in `/etc/xarxa/.env` on the box (mode 600, owned by `xarxa`):

- `NEXTAUTH_SECRET` — `openssl rand -base64 64` at provision time
- `POSTGRES_PASSWORD` — `openssl rand -base64 32` at provision time
- `RESEND_API_KEY` — from Resend dashboard after domain verify
- `SENTRY_DSN` — from Sentry dashboard (read by app at runtime)
- `SENTRY_AUTH_TOKEN` — from Sentry dashboard (read by `deploy-prod.sh` at build time to upload source maps; not exposed to the running app container)

`docker-compose.prod.yml` references each via `${VAR}` syntax; values never appear in git. The local-dev `docker-compose.yml` is untouched and keeps using its placeholder secrets.

A fifth secret, `BACKUP_ENCRYPTION_KEY`, is kept separately at `/etc/xarxa/backup.key` (mode 400, owned by `root`) — only the backup cron job (running as root) reads it. Defense-in-depth: the app container never needs the key, so it shouldn't have access. Details in §13.

### 7. Rate limiting — new file `src/lib/rate-limit.ts`

In-memory LRU with timestamp windows. Single-box, single Node process — no Redis needed.

| Route | Limit | Key |
|---|---|---|
| `POST /api/auth/register` | 5/hour | IP |
| `POST /api/auth/callback/credentials` (sign-in) | 10/hour per IP, 5/hour per email | IP + email |
| `POST /api/auth/resend-verification` | 1/min, 5/hour | email |
| `POST /api/posts` | 10/hour | userId |
| `POST /api/connections` | 30/day | userId |
| Socket.io `send-message` | 20/min | userId |

Returns `429 { error: "RATE_LIMIT" }` with `Retry-After` header on hit. Client shows "Too many tries, wait a minute."

### 8. Security headers — modified `next.config.mjs`

`headers()` adds:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options:    nosniff
Referrer-Policy:           strict-origin-when-cross-origin
Permissions-Policy:        camera=(), microphone=(), geolocation=()
X-Frame-Options:           DENY
```

### 9. Content-Security-Policy — middleware that injects per-request nonce

```
default-src 'self';
script-src  'self' 'nonce-{nonce}';
style-src   'self' 'unsafe-inline';
img-src     'self' data: blob: https:;
connect-src 'self' wss: https://*.sentry.io;
font-src    'self' data:;
frame-ancestors 'none';
form-action 'self';
base-uri    'self';
```

`style-src 'unsafe-inline'` is a known compromise pending a Phase 5 tightening pass (Tailwind/Next inject runtime styles that would need hashing or nonce-ing).

### 10. CSRF defense

NextAuth v5's CSRF tokens cover its own routes. Custom mutating routes are defended by:

1. `httpOnly` + `sameSite=lax` session cookies (NextAuth default)
2. `getServerSession()` required on every mutating route
3. New middleware check: `POST/PUT/PATCH/DELETE` to `/api/*` must have an `Origin` header matching `NEXTAUTH_URL` — belt-and-suspenders against rare browser/proxy edge cases

### 11. Small but important fixes

- **Bcrypt cost factor** raised to ≥12 in `src/lib/auth.ts` (verify current value during implementation)
- **Env validation at boot**: new `src/lib/env.ts` Zod schema validates `process.env` on import; missing or malformed secrets fail-fast at startup
- **Cookie `secure` flag** confirmed honored by NextAuth (set automatically when `NEXTAUTH_URL` starts with `https://`)
- **Next.js telemetry disabled** at build time: `next telemetry disable`

### 12. Monitoring stack

| Layer | Tool | What it watches | Alerts when |
|---|---|---|---|
| Errors | Sentry (`@sentry/nextjs`, free tier 5k events/mo) | Unhandled exceptions, slow API routes | New error type appears |
| Liveness | UptimeRobot (free, 50 monitors) | `GET https://xarxa.org/` every 5 min | Site unreachable ≥2 checks (~10 min) |
| Resource | Hetzner Cloud Console (built-in) | CPU, RAM, disk graphs | Read manually on incidents |
| Requests | Caddy `access.log` on box | All HTTP requests | None proactive; SSH in when needed |
| Email | Resend dashboard | Sent, bounced, complained | New bounce/complaint |

Sentry sample rate: 100% errors, 10% performance traces. Source maps uploaded at build time so stack traces resolve to original file names. Release tagged with commit SHA on each deploy via a `COMMIT_SHA` build arg added to the Dockerfile and supplied by `deploy-prod.sh` (§14).

**Out-of-scope monitoring (deferred):** Grafana/Loki/Prometheus, product analytics (Plausible/PostHog), log aggregation, status page.

### 13. Backups

Three tiers, all going off-box.

| Tier | Mechanism | Frequency | Retention | Where |
|---|---|---|---|---|
| Database | `pg_dump` piped through `gpg --symmetric` | Nightly at 03:00 UTC | 7 daily + 4 weekly + 3 monthly (rclone lifecycle) | Backblaze B2 free tier |
| Uploads | `restic` snapshot of `public/uploads/` (encrypted, deduped) | Nightly at 03:30 UTC | Same lifecycle | Backblaze B2, same bucket different prefix |
| Whole-box | Hetzner snapshot (built-in feature) | Weekly, Sunday | Keep 2 (~€0.40/month) | Hetzner |

Backblaze B2 chosen over Hetzner Storage Box because: free tier is sufficient; off-provider isolates against a Hetzner-wide outage; S3-compatible API works with `restic` and `rclone` out of the box.

`BACKUP_ENCRYPTION_KEY` is generated at provision time (`openssl rand -base64 32`), printed once for the operator to copy off-box (password manager), and persisted at `/etc/xarxa/backup.key` (mode 400, owned by `root`). The nightly cron runs as root so it can read the key; the app container has no access to it (it doesn't need encryption keys to operate). Losing both the box and this key means backups are useless.

**Backup-failure alerting:** cron job sends a "FAILED" email via Resend on any non-zero exit. Silence = success.

**Restore drill:** every quarter, decrypt the latest dump and restore into a throwaway local Docker Postgres, verify row counts match prod. ~30 min in the runbook. A backup never restored is not a backup.

### 14. Deploy mechanism — new file `deploy-prod.sh` on the box

```bash
#!/bin/bash
set -euo pipefail
cd /opt/xarxa

git fetch origin
git reset --hard origin/main

SHA=$(git rev-parse --short HEAD)
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml build \
  --build-arg COMMIT_SHA=$SHA app

docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml run --rm \
  app npx prisma db push

docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps app

sleep 5
curl -sf https://xarxa.org/ > /dev/null || { echo "Smoke failed"; exit 1; }
echo "Deploy OK at $(date) — sha=$SHA"
```

Manual invocation only: SSH in and run. No auto-deploy on git push — first prod environment, one operator, intentional shipping. GitHub Actions CI is a follow-up.

### 15. Rollback

| Severity | Method | Time |
|---|---|---|
| App bug, no data corruption | `git checkout <last-good-sha> && ./deploy-prod.sh` | ~90s |
| Bad migration, app crashing | Same as above + manual `psql` to fix the column if needed | ~3 min |
| Whole-box hosed | Restore DB + uploads from B2, swap DNS to fresh Hetzner box, redeploy | ~30 min via runbook |

### 16. Runbook — new file `docs/runbook.md`

Committed to repo. Sections:

1. **"Site is down" decision tree** — DNS? Caddy? App? Postgres? Disk full?
2. **Common commands** — view logs, restart app, restart Postgres, check disk, reclaim disk, force-renew TLS
3. **Database restore from backup** — step-by-step `gpg --decrypt` + `psql` recipe
4. **Rotate `NEXTAUTH_SECRET`** — for suspected leak; invalidates all sessions (expected)
5. **External links** — Hetzner panel, Cloudflare dashboard, Resend, Sentry, UptimeRobot, Backblaze B2
6. **Escalation** — what info to grab before asking Claude for help (last 200 log lines, Sentry link, `docker ps -a` output)

---

## Provisioning order

High-level sequence to be expanded into the implementation plan:

1. Create accounts: Hetzner, Cloudflare, Resend, Sentry, UptimeRobot, Backblaze B2 (operator action with hand-holding)
2. Buy `xarxa.org` at Cloudflare Registrar (operator)
3. Provision Hetzner CX22 with Ubuntu 24.04 + SSH key (operator clicks; Claude prepares the SSH key locally)
4. Initial SSH-in hardening: disable password auth, `ufw` rules, install Docker, install `unattended-upgrades` (Claude drives, operator observes)
5. Clone repo to `/opt/xarxa`, write `/etc/xarxa/.env`, generate the five secrets (Claude drives)
6. Implement the application changes (email verification, security headers, rate limiting, env validation, CSP middleware) — Claude writes, operator reviews PR, merge to `main`
7. Configure Cloudflare DNS records — Claude prepares via Cloudflare API once operator provides a scoped token; operator can also do via dashboard
8. First `./deploy-prod.sh` — together; iterate on failure
9. Verify Resend domain (click DKIM-record-added in Resend dashboard, send a test email to operator)
10. Wire up Sentry SDK + UptimeRobot monitor + Backblaze B2 + backup cron jobs (Claude drives)
11. Restore drill on a throwaway local Docker Postgres — together, builds confidence
12. Update `README.md` with the live URL, commit

---

## Risks and open items

- **Operator availability for incidents.** The model is "respond within ~24h when something breaks." On longer vacations, the site stays up under normal conditions but is unrecoverable from a real failure without a co-operator. Acceptable trade for a community project; documented.
- **DKIM/SPF reputation.** A fresh sending domain has no reputation. Initial verification emails may land in spam for some recipients. Mitigations: SPF + DKIM + DMARC at `p=none` from day one, monitor Resend bounce/complaint rates for the first 2 weeks, escalate DMARC to `p=quarantine` only after confidence is built.
- **No staging environment.** All changes go straight to prod. Mitigated by manual deploy + smoke test + ~90s rollback. Acceptable for current scale; revisit after first "I wish I had staging" incident.
- **`prisma db push` instead of `prisma migrate`.** Convenient and idempotent for additive changes; doesn't generate rollback-able SQL migration files. Acceptable for current schema shape (no destructive operations); switch to `migrate` when a destructive change is needed.
- **In-memory rate limiter resets on app restart.** Acceptable for single-box; on a restart, a burst is briefly possible. Externalize to Redis or Upstash if it ever becomes a real problem.
- **B2 free tier is 10 GB stored / 1 GB/day downloads.** Plenty of headroom at current scale, but a sudden upload-heavy growth could blow the cap. Monitor B2 usage in the Backblaze dashboard.

---

## Acceptance criteria

The deploy is "done" when:

1. `https://xarxa.org/` loads with a valid Let's Encrypt cert, `<title>xarxa</title>`, and the existing homepage
2. New user can sign up at `/auth/register`, receive a verification email from `noreply@xarxa.org`, click the link, and post on the board
3. An unverified user can browse the board but sees "Verify your email" on the create-post and express-interest buttons
4. Hitting `POST /api/auth/register` 6 times in an hour from one IP returns 429
5. `curl -sI https://xarxa.org/` shows `Strict-Transport-Security`, CSP, X-Frame-Options headers
6. Rebooting the Hetzner box (`sudo reboot`) brings the full stack back up unattended within ~2 minutes (Caddy, app, Postgres all `up`)
7. Sentry captures a manual `throw new Error("smoke")` from the homepage
8. UptimeRobot shows the monitor in "up" state with a green history
9. Nightly cron runs, a `pg_dump.sql.gpg` lands in the B2 bucket
10. Restore drill: take the most recent B2 dump, `gpg --decrypt | psql` into a local Docker Postgres, row counts match prod
11. `/etc/xarxa/.env` exists on the box (mode 600), and no secrets appear anywhere in the git repo
12. `docs/runbook.md` exists in the repo with all six sections filled
13. CLAUDE.md and README.md updated with live URL and pointer to the runbook

---

## What this spec deliberately does NOT cover

Recap of the non-goals so the implementation plan stays focused:

- Password reset by email — separate spec
- Reports / blocks / content moderation — separate spec
- Path-traversal hardening on uploads, audit logging, MFA, account lockout — Phase 5 audit
- SEO / Open Graph / sitemap
- E2E and integration test suite
- GitHub Actions CI/CD
- Staging environment
- Product analytics (Plausible / PostHog)
- Privacy policy and Terms pages (content task; required before fully public, not in this infra spec)
- Receiving email at `@xarxa.org`
- Migrating to Fly.io or another host
- Cloudflare orange-cloud proxy enabled
- Tightening `style-src` away from `unsafe-inline`
