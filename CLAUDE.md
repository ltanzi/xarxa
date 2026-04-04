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
- maria@example.com / password123 (Private)
- info@associaciolliure.org / password123 (Collective)

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
- **Posts**: Flat list style, mono labels for type/category
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
- `/api/notifications` returns `{ unreadMessages, pendingConnections, acceptedRequests }` — navbar polls every 30s
- `/api/connections/seen` — POST to mark accepted connections seen (also done server-side on dashboard + chat page load)

## Search (PostFilters)
- Tag-based: type a word → Enter → black pill tag; multiple tags = OR search
- Real-time debounced (300ms) as you type
- `basePath` prop controls where filter URLs push (default `/board`)
- Prisma query: `terms.flatMap(term => [title contains, description contains])` for OR across terms

## Sign-in / Register
- After sign-in or registration, redirects to `/` (home), not `/board`

## Known Issues
- Middleware uses `getToken` with explicit `secret` (edge runtime incompatibility)
- `docker-compose.yml` has `version` key which is obsolete (warning only)

## GitHub
- Repo: https://github.com/ltanzi/xarxa
- All code is pushed to `main`

## Design Docs
- Spec: `docs/superpowers/specs/2026-03-27-xarxa-design.md`
- Plan: `docs/superpowers/plans/2026-03-27-xarxa.md`
- Tech overview: `docs/tech-overview.md`
