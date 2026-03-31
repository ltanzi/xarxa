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
- `.env` — NEXTAUTH_URL must be `http://192.168.100.16:3000` (not localhost) for signOut redirect to work

## Current Design State (main branch)
- **Font**: Inconsolata (mono, slightly playful/round) — 13px body, paper-grain background (#EDE8E0)
- **Homepage**: Centered layout — hands.png illustration (mix-blend-multiply, 40% opacity) above centered title "A space for *mutual* help", centered subtitle, centered buttons (Ask help, Offer help | Browse the board)
- **Image**: `hands.png` in repo root + `public/hands.png` — hand-drawn characters holding hands
- **Navbar**: No Board link (accessible from homepage buttons instead). Grouped: [xarxa] ... [Dashboard Chat] | [Profile Exit]
- **Notification badges** on Dashboard (pending connections) and Chat (unread messages), polling every 30s
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
