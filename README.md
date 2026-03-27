# xarxa

A volunteer service exchange platform where individuals and collectives can offer or request services for free. Think of it as a community bulletin board with real-time chat.

## Features

- **User registration** — sign up as a private individual or collective (NGO, association, etc.)
- **Service posts** — create offers or requests across categories (Legal, Education, Health, Technology, Manual Work, Translation)
- **Public board** — browse, search, and filter posts by type, category, and location
- **Matching** — express interest in a post; when accepted, a private chat opens automatically
- **Real-time chat** — one-to-one messaging with Socket.io
- **Profiles** — customizable profiles with photo upload, skills/mission, and location
- **i18n-ready** — English default, with translation structure for adding languages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v5 (credentials + Google OAuth) |
| Real-time | Socket.io |
| Validation | Zod |
| Containerization | Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for PostgreSQL)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd xarxa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if needed. Defaults work for local development.

4. **Start PostgreSQL**
   ```bash
   docker compose up -d postgres
   ```

5. **Set up the database**
   ```bash
   npx prisma db push
   ```

6. **Seed demo data**
   ```bash
   npx prisma db seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open** [http://localhost:3000](http://localhost:3000)

### Demo Accounts

| Email | Password | Type |
|-------|----------|------|
| maria@example.com | password123 | Private individual |
| info@associaciolliure.org | password123 | Collective |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Yes |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

## Project Structure

```
src/
├── app/             # Next.js App Router (pages + API routes)
├── components/      # React components (ui, layout, posts, chat, profile)
├── lib/             # Shared utilities (prisma, auth, validations)
├── types/           # TypeScript type definitions
└── i18n/            # Translation system
prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Seed data
server.ts            # Custom server (Next.js + Socket.io)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## License

MIT
