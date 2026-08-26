# xarxa — Project Context

## What is this?
Volunteer service exchange platform. Individuals and organizations offer/request free services. Community bulletin board with real-time chat.

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma 7 (with `@prisma/adapter-pg`)
- NextAuth.js v5 beta (credentials + Google OAuth)
- Socket.io for real-time chat (custom `server.ts`)
- Zod for validation, local filesystem for photo uploads

## Key Prisma 7 Notes
- Prisma 7 uses `client` engine by default — requires `@prisma/adapter-pg` in `PrismaClient` constructor
- Datasource URL lives in `prisma.config.ts`, NOT in `schema.prisma`
- Seed config also in `prisma.config.ts` under `migrations.seed`
- Both `src/lib/prisma.ts` and `prisma/seed.ts` must create adapter: `new PrismaPg(process.env.DATABASE_URL!)`

## Running Locally
```bash
docker compose up -d postgres   # only starts postgres, NOT the app container
npm run dev
# Runs on http://0.0.0.0:3000 (machine IP: 192.168.100.16)
```
Note: `docker compose up -d` (without specifying service) tries to build the app container and fails — always use `docker compose up -d postgres` for the DB only.

## Demo Accounts
All passwords: `Password1!` (meets uppercase + special-char requirement)
- info@foc.cat (Collective — F O C, cultural space)
- hola@caninofm.com (Collective — Canino FM, online radio)
- emma@example.com (Private — Emma Whitfield, legal advice)
- marc@example.com (Private — Marc Puig, manual work)
- sofia@example.com (Private — Sofia Romero, violin teacher)

## Project Structure
- `server.ts` — Custom server wrapping Next.js + Socket.io
- `src/app/` — Pages and API routes
- `src/components/` — ui/, layout/, posts/, chat/, profile/
- `src/lib/` — prisma.ts, auth.ts, auth-utils.ts, validations.ts
- `src/i18n/` — Full i18n system (EN/ES/CA)
- `prisma/` — schema.prisma, seed.ts

## i18n System
- **3 languages**: English (en), Spanish (es), Catalan (ca)
- **Locale storage**: cookie (`locale=en|es|ca`, 1 year, path=/)
- **Client components**: `useTranslation()` from `src/i18n/hook.ts`
- **Server components**: `await getTranslations()` from `src/i18n/server.ts`
- **Provider**: `src/i18n/provider.tsx` — takes `initialLocale` prop from layout (reads cookie server-side), exposes `setLocale`
- **Switcher**: `LanguageSwitcher` in Navbar — calls `setLocale` + `router.refresh()` so server components re-render
- **Locale files**: `src/i18n/locales/{en,es,ca}.json`
- All pages and components are fully wired up

## Config Files
- `next.config.mjs` (NOT .ts — Next.js 14 doesn't support .ts)
- `tsconfig.server.json` — For compiling server.ts
- `prisma.config.ts` — Prisma 7 config (datasource URL, seed command)
- `.env` — NEXTAUTH_URL must be `http://192.168.100.16:3000` (not localhost) for signOut redirect to work

## Current Design State (main branch)
- **Font**: Inconsolata (mono, slightly playful/round) — 13px body, paper-grain background (#EDE8E0)
- **Homepage**: Hero-only. hands.png (mix-blend-multiply, 40% opacity) above centered title "A space for *collective* help", subtitle, then a 2×1 button grid: [Ask help] [Offer help] / [Browse the board (black, full width)]
- **Image**: `hands.png` in repo root + `public/hands.png` — hand-drawn characters holding hands. `hands_borders.png` also in `public/` as alternative.
- **Board**: Separate page `/board` with tag-based search (real-time debounced, multi-term OR), type/category filters, "Board" title left-aligned
- **Navbar**: No Board link. Grouped: [xarxa] ... [Dashboard Chat] | [Profile Exit] | [en/es/ca]
- **Notification badges** on Dashboard (pending + accepted-unseen connections) and Chat (unread messages), polling every 30s
- **Chat list**: Three visual states — unread (dot + bold name + bright preview), needs reply (normal), waiting/sent last (muted + "You:" prefix)
- **Posts**: Flat list style, mono labels for type/category/urgency
- **Select component**: Custom dropdown (not native `<select>`) matching LocationInput style — keyboard navigable, styled popup
- **Minimal editorial** aesthetic — no rounded corners, no colored badges, no shadows

## Design Branch: `design-b-dark-mode`
Dark mode variant user liked. Near-black bg (#0D0D0D), off-white text (#E8E4DC), neon green accent (#4ADE80). Same layout/structure as main. Kept as alternative option.

### What Was Tried & Rejected
- Colorful startup-style (coral, lime, doodles, handwritten fonts) — "looks like a startup"
- Cormorant Garamond serif + paper grain + terracotta accent — rejected
- Generative flow-field background — "looks dirty/hair"
- Topographic contour line background — rejected
- Anton headlines + tighter spacing — rejected
- Proposal A: spot red + rough hand-drawn borders — rejected
- Proposal C: DM Sans bold titles + doodle decorations + category spot colors — rejected
- User prefers incremental changes, not wholesale redesigns

## Notifications
- `Connection.seenByRequester Boolean @default(false)` — set to true when requester visits dashboard or opens the chat
- `/api/notifications` returns `{ unreadMessages, pendingConnections, acceptedRequests }`
- Real-time via Socket.io: Navbar connects to socket, joins `user:{id}` room, listens for `notifications:update` events (replaced 30s polling)
- `notifyUser(userId)` in `src/lib/socket.ts` — API routes call this to push notifications via `globalThis.__io`
- `/api/connections/seen` — POST to mark accepted connections seen (also done server-side on dashboard + chat page load)

## Search (PostFilters)
- Tag-based: type a word → Enter → black pill tag; multiple tags = OR search
- Real-time debounced (300ms) as you type
- `basePath` prop controls where filter URLs push (default `/board`)
- Prisma query: `terms.flatMap(term => [title contains, description contains])` for OR across terms

## Sign-in / Register
- After sign-in or registration, redirects to `/` (home), not `/board`

## Completed Improvements (Phases 1–3 + Account Deletion)

### Phase 1 — Critical Fixes
- Full i18n wiring: all hardcoded strings replaced with translation keys across EN/ES/CA
- Chat reliability: Socket.io reconnection (infinite attempts, 1–10s backoff), message deduplication, failed-send recovery (removes optimistic message, restores input)
- Socket.io authentication: JWT cookie decoding in server.ts middleware, conversation membership validation on `join-conversation`
- Pagination on board: 20 posts/page with page controls
- Loading states: skeleton loaders for board, chat, dashboard, profile
- Error/not-found pages: `src/app/error.tsx`, `src/app/not-found.tsx`
- Google OAuth redirect: new users redirected to `/profile/edit` via cookie + middleware

### Phase 2 — UX Polish
- Post management: edit, delete (with inline confirmation), close/reopen — via `PostActions` component on post detail page
- Connection flow: author sees connections list on their post detail page
- Chat date separators: "Today", "Yesterday", or formatted date between message groups
- Profile improvements: surname field (required for PRIVATE users), city autocomplete (Photon/OpenStreetMap), language autocomplete (local ISO list), remove photo button
- Board search: matches tags in addition to title/description
- Mobile fixes: `100dvh`, tighter gaps on filters, flex-wrap on type filter row
- Replaced all native `confirm()` dialogs with inline confirmation UI
- Dashboard: accepted connections stay visible in Incoming section with chat link (not just pending)
- Chat back button uses `router.push` + `router.refresh()` to bust Next.js 14 client-side Router Cache (unread dot clears immediately)
- 24h time format and DD/MM/YYYY date format across chat and board
- Post cards show creation date
- Seed posts have varied `createdAt` dates spread across last month
- Post urgency: LOW/NORMAL/URGENT — shown on cards and detail page, filterable on board, stored as Prisma `Urgency` enum
- Custom Select component: replaced native `<select>` with styled dropdown matching LocationInput (keyboard nav, consistent UI)

### Phase 3 — Performance
- Real-time notifications via Socket.io: replaced 30s polling with user rooms (`user:{id}`), `notifyUser()` helper in `src/lib/socket.ts` for API routes
- Database indexes on Post, Connection, Message tables for common queries
- Font: switched from render-blocking `@import` to `next/font/google` (Inconsolata, self-hosted via CSS variable)
- Image optimization: `sharp` resizes uploads to 512×512 WebP (quality 80)
- Conversation list limited to 50

### Account Deletion
- `DeleteAccount` component (`src/components/profile/DeleteAccount.tsx`): inline confirmation, calls DELETE `/api/profile`
- API route cascades deletion in a `$transaction`: messages → connections (+ their conversations) → posts → conversation disconnect → user delete
- Signs out after successful deletion

### Code Review Fixes
- **Security**: `send-message` socket handler checks room membership before broadcasting; `POST /api/connections` rejects closed posts
- **Data integrity**: Account deletion and post deletion wrapped in `prisma.$transaction()`; orphaned conversations/messages cleaned up
- **Error handling**: `DeleteAccount` and `PostActions` show error feedback on failure with try-catch; JWT decode, socket notifications, connections route all log errors; `notifyUser()` logs one-time warning when Socket.io unavailable; `sharp` errors return user-friendly 400
- **Types**: Shared `AuthorSummary`/`AuthorDetail`/`PostWithAuthor` in `src/types/index.ts`; `PostCard` uses shared type; profile page author select includes `surname`
- **Code quality**: Extracted `requireSurnameForPrivate` in `validations.ts` (shared by register + profile schemas); `PostFormProps` uses discriminated union coupling `postId` + `initialData`; removed redundant comments

## Production

- **Live at:** https://xarxa.help (Hetzner CX23, Frankfurt, ARM-free; Ubuntu 26.04)
- **SSH:** `ssh xarxa-prod` (alias for `xarxa@167.233.204.178`)
- **App root on box:** `/opt/xarxa`
- **Secrets:** `/etc/xarxa/.env` (mode 600 xarxa), `/etc/xarxa/backup.key` (mode 400 root), `/etc/xarxa/backup.env` (mode 400 root)
- **systemd:** `xarxa.service` runs `docker compose up -d` on boot
- **Cron:** `/etc/cron.d/xarxa-backups` runs `scripts/backup-with-alert.sh postgres` every 4h, `uploads` at 03:30 UTC; `/etc/cron.d/xarxa-health` runs `scripts/health-alert.sh` every 30min (emails on disk >80% / RAM <300MB)
- **TLS:** Caddy auto-renews Let's Encrypt
- **Edge:** Cloudflare DNS-only (gray cloud) at the registrar; Resend handles transactional email
- **Backups:** pg_dump + restic → Backblaze B2 bucket `xarxa-backups`
- **Runbook:** `docs/runbook.md` (decision tree, common commands, rollback, restore drill)
- **Deploy:** SSH in, `cd /opt/xarxa && ./deploy-prod.sh`. Health-gated (`up --wait` on `/api/health`); images tagged `xarxa-app:<sha>` (last 5 kept). Instant rollback: `COMMIT_SHA=<good-sha> docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app`
- **Migrations:** `prisma migrate deploy` in the deploy script (baselined `0_init` 2026-08-26). New schema work: `npx prisma migrate dev --name <change>` locally, commit the folder. Never `db push` against prod.
- **CI:** `.github/workflows/ci.yml` — tsc (app + server, asserts dist/ is a single file), lint, build on every PR. Type/lint errors fail the build (ignore flags removed).

## Roadmap

### Phase 5 follow-ups (after go-live)
- UptimeRobot: add second keyword monitor (`"socket":true`) against https://xarxa.help/api/health
- Verify Hetzner automated snapshots are enabled (console)
- VerificationToken consumedAt DB-level enforcement (currently delete-on-consume convention)
- Block-user / report-user from chat (post reports shipped: operator email + auto-close at 3 distinct reports)
- Tighten CSP `style-src` (drop 'unsafe-inline' once Tailwind/Next runtime styles are nonce'd)
- Email notifications for interest/accept/unread-message (the #1 retention gap — see review artifact)
- Post expiry / auto-archive with "still active?" nudge
- How-it-works lines on landing + /guidelines page
- Accessibility pass: Select ARIA, input label associations, eye-toggle keyboard access, mobile filter collapse
- Test suite (unit + integration + E2E for critical paths)
- SEO: meta tags, Open Graph, sitemap
- Privacy policy + Terms pages (content)

### Completed at go-live (this is what shipped)
- Email verification (soft wall): `/auth/verify` interstitial + tokens
- Rate limiting: register, sign-in, resend, posts, connections, chat (HTTP + Socket.io)
- Security headers: HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy, X-Content-Type-Options
- CSP with per-request nonce + strict-dynamic + scoped connect-src
- Origin-header CSRF check on mutating /api/* requests; Cloudflare proxy XFF-overwrite in Caddy
- Zod env validation at server startup
- Secrets out of git: `/etc/xarxa/.env` mode 600 + docker-compose.prod.yml via --env-file
- Encrypted off-box backups (gpg + restic → Backblaze B2) with pipefail+email failure alerting
- Production deploy script with `--keep-head` rollback support
- Runbook with decision tree + restore recipe

## GitHub
- Repo: https://github.com/ltanzi/xarxa
- Default branch: `main` — go-live work landed via PR #2 (branch `worktree-go-live`)

## Design Docs
- Go-live spec: `docs/superpowers/specs/2026-06-24-xarxa-go-live-design.md`
- Go-live plan: `docs/superpowers/plans/2026-06-24-xarxa-go-live.md`
- Production runbook: `docs/runbook.md`
- Tech overview: `docs/tech-overview.md`
