# xarxa — Project Context

## What is this?
Volunteer service exchange platform. Individuals and collectives offer/request free services. Community bulletin board with real-time chat.

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
docker compose up -d postgres
npx prisma db push
npx prisma db seed
npm run dev
# Runs on http://0.0.0.0:3000 (machine IP: 192.168.100.16)
```

## Demo Accounts
- maria@example.com / password123 (Private)
- info@associaciolliure.org / password123 (Collective)

## Project Structure
- `server.ts` — Custom server wrapping Next.js + Socket.io
- `src/app/` — Pages and API routes
- `src/components/` — ui/, layout/, posts/, chat/, profile/
- `src/lib/` — prisma.ts, auth.ts, auth-utils.ts, validations.ts
- `src/i18n/` — Lightweight i18n (English default, JSON + context/hook)
- `prisma/` — schema.prisma, seed.ts

## Config Files
- `next.config.mjs` (NOT .ts — Next.js 14 doesn't support .ts)
- `tsconfig.server.json` — For compiling server.ts
- `prisma.config.ts` — Prisma 7 config (datasource URL, seed command)

## Current Design State
Current fonts: **IBM Plex Mono** (body, 13px) with paper-grain background (#EDE8E0). Minimal editorial style.

### Zine Reference Analysis (ref.jpeg — keep this file in repo root)
User provided a printed fanzine as design reference. Key findings:
- **Body font is SERIF** (like Times/Georgia), NOT mono — classic book/newspaper feel
- **Headlines: bold condensed sans-serif** — heavy, stacked vertically, poster-like
- **No gray/muted text** — all text is black, hierarchy comes from size alone
- **Tight line-height** (~1.3-1.4) on body, dense paragraphs
- **Background: plain warm off-white** — no digital grain texture needed
- **Knocked-out box** (white rectangle behind a word) is a nice graphic device
- **Metadata: tiny caps at the top** — functional, not decorative
- **Two-column layout** in places, text wraps around illustrations

### Next Steps for Design
Apply the zine reference findings: switch body to a serif, keep condensed sans for headlines, remove grain texture, tighten line-height, make all text black (no muted gray for body).

### What Was Tried & Rejected
- Colorful startup-style (coral, lime, doodles, handwritten fonts) — "looks like a startup"
- Cormorant Garamond serif + paper grain + terracotta accent — rejected
- Generative flow-field background (hair-like traces) — "looks dirty"
- Topographic contour line background — rejected
- Anton headlines + 12px mono + tighter spacing — rejected (too different from current base)
- User prefers incremental changes from the current IBM Plex Mono base

## Known Issues
- Middleware uses `getToken` with explicit `secret` (Prisma 7 / edge runtime incompatibility with full auth import)
- `docker-compose.yml` has `version` key which is obsolete (warning only)

## GitHub
- Repo: https://github.com/ltanzi/xarxa
- All code is pushed to `main`

## Design Docs
- Spec: `docs/superpowers/specs/2026-03-27-xarxa-design.md`
- Plan: `docs/superpowers/plans/2026-03-27-xarxa.md`
- Tech overview: `docs/tech-overview.md`
