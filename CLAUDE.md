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

## Roadmap

### Phase 4 — Code Quality & Robustness
- Environment variable validation at startup (Zod schema for env)
- Clean up unused dependencies
- Remaining type safety gaps (typed Socket.IO event maps, strict TypeScript)
- Upload security hardening (path traversal protection)
- Standardized API response envelope

### Phase 5 — Before Real Users
- Rate limiting on auth and API endpoints
- CSRF protection
- Content Security Policy headers
- Move secrets out of docker-compose into proper env management
- Email verification flow
- Report/block functionality
- SEO: meta tags, Open Graph, sitemap
- Testing: unit tests for validation, integration tests for API routes, E2E for critical flows

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
