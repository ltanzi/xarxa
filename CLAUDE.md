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

## Design Direction
Current aesthetic: **editorial / conceptual art minimal**. User explicitly rejected startup-style playfulness.
- Fonts: Space Grotesk (body) + Space Mono (labels/metadata)
- Background: warm paper (#F5F3EF), text: near-black (#1A1A1A), muted: #8A8A8A
- Accent: red (#E63B2E) used only for errors/destructive
- No rounded corners, no colored badges, no shadows
- Posts displayed as a flat list (like an exhibition index), not cards
- Inputs: bottom-border only, no boxes
- Buttons: square, black bg / white text for primary; underlines for secondary actions
- Monospace uppercase labels for metadata (type, category, status)
- References the user likes: rhizomerm.com (minimalism), rizomes.com (structure, design feel)
- User wants: "as if designing an art/design website — cool in a conceptual art way"
- Iterating on this — more changes expected

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
