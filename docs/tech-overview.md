# xarxa — Technology Overview

A plain-language guide to every technology used in this project.

---

## The Big Picture

xarxa is a **web application** — it runs in the browser. When you visit the site, your browser (the **frontend**) talks to a **server** (the **backend**) which reads and writes data to a **database**. On top of that, there's a **real-time layer** so chat messages appear instantly without refreshing the page.

```
┌──────────┐     HTTP      ┌──────────────┐     SQL      ┌────────────┐
│  Browser  │ ◄──────────► │  Next.js     │ ◄──────────► │ PostgreSQL │
│ (React)   │              │  Server      │   (Prisma)   │ (Database) │
└──────────┘               └──────────────┘              └────────────┘
      ▲                          ▲
      │      WebSocket           │
      └──────────────────────────┘
              (Socket.io)
```

---

## Frontend (what you see)

### Next.js
The **framework** that powers the entire app — both the pages you see and the server behind them. Think of it as the foundation of the house. It's built on top of React (see below) and adds:
- **Routing** — each file in `src/app/` becomes a page (e.g., `src/app/board/page.tsx` → `/board`)
- **Server-side rendering** — pages can load data on the server before sending HTML to the browser, which makes them faster and better for search engines
- **API routes** — you can write backend endpoints (like `/api/posts`) inside the same project, no separate server needed

We use the **App Router**, which is Next.js's modern way of organizing pages using folders.

### React
The **UI library** inside Next.js. React lets you build the interface out of small, reusable pieces called **components**. For example:
- `<Button>` — a styled button
- `<PostCard>` — a card showing a post's title, type, and author
- `<ChatRoom>` — the full chat interface

When data changes (e.g., a new message arrives), React automatically updates only the parts of the page that need to change — you don't have to reload the whole page.

### TypeScript
A version of JavaScript with **type checking**. Instead of just writing `name = "Maria"`, you declare `name: string = "Maria"`. This catches bugs at development time — for example, if you accidentally try to use a number where a string is expected, TypeScript will warn you before the code even runs.

Every file ending in `.ts` or `.tsx` is TypeScript.

### Tailwind CSS
A way to style the interface. Instead of writing CSS in a separate file, you put class names directly on HTML elements:

```html
<!-- Traditional CSS -->
<button class="my-button">Click me</button>

<!-- Tailwind CSS -->
<button class="bg-indigo-600 text-white px-4 py-2 rounded-md">Click me</button>
```

Each class does one thing: `bg-indigo-600` = indigo background, `text-white` = white text, `px-4` = horizontal padding, `rounded-md` = rounded corners. It's fast to write and keeps styles consistent.

---

## Backend (what happens behind the scenes)

### API Routes
These are the endpoints that the frontend calls to get or send data. They live in `src/app/api/`. Examples:
- `GET /api/posts` — returns the list of posts
- `POST /api/posts` — creates a new post
- `POST /api/auth/register` — registers a new user
- `PATCH /api/connections/123` — accepts or rejects a connection

They receive a request, talk to the database, and return a JSON response.

### Zod
A **validation library**. Before saving data to the database, Zod checks that it's valid. For example, the registration form requires:
- Email must be a real email format
- Password must be at least 8 characters
- Name can't be empty
- Type must be either "PRIVATE" or "COLLECTIVE"

If the data doesn't match, Zod returns a clear error message. This prevents bad data from getting into the database and protects against malicious input.

---

## Database

### PostgreSQL (Postgres)
The **database** — where all the data lives permanently. It's a relational database, which means data is stored in **tables** with rows and columns, like a spreadsheet:

| Table | What it stores |
|-------|---------------|
| User | All registered users (name, email, password, etc.) |
| Post | Service offers and requests |
| Connection | When someone expresses interest in a post |
| Conversation | A chat thread between two users |
| Message | Individual chat messages |

Tables are linked together with **relationships**. For example, every Post has an `authorId` that points to a User. Every Message has a `senderId` (User) and `conversationId` (Conversation).

### Prisma
The **bridge** between your code and the database. Without Prisma, you'd write raw SQL queries like:

```sql
SELECT * FROM "Post" WHERE type = 'OFFER' ORDER BY "createdAt" DESC;
```

With Prisma, you write TypeScript instead:

```typescript
const posts = await prisma.post.findMany({
  where: { type: "OFFER" },
  orderBy: { createdAt: "desc" },
});
```

Prisma also:
- Defines the database structure in a **schema file** (`prisma/schema.prisma`) — this is the single source of truth for what tables and columns exist
- **Generates types** so TypeScript knows exactly what fields each table has
- Handles **migrations** — when you change the schema, Prisma updates the database to match

---

## Authentication

### NextAuth.js (Auth.js)
Handles **user login and sessions**. It supports two ways to sign in:

1. **Credentials** — email + password. The password is stored as a **hash** (a scrambled version using bcrypt) so even if someone accesses the database, they can't read the actual passwords.

2. **Google OAuth** — "Sign in with Google". Google confirms the user's identity and sends back their name/email. No password stored on our side.

After signing in, NextAuth creates a **JWT token** (a small encrypted piece of data) stored in a cookie. On every request, the server reads this token to know who the user is — without needing to look up a database session.

**Middleware** (`src/middleware.ts`) protects certain pages. If you visit `/dashboard` without being logged in, you get redirected to the sign-in page.

---

## Real-time Chat

### Socket.io
A library for **real-time communication**. Normally, the browser has to ask the server for updates (like refreshing a page). With Socket.io, the server can **push** updates to the browser instantly.

How it works:
1. When you open a chat, your browser opens a **WebSocket connection** — a persistent two-way channel between browser and server
2. When you send a message, it goes to the server
3. The server saves it to the database AND immediately pushes it to the other person's browser
4. The other person sees the message appear in real-time — no page refresh needed

The Socket.io server is attached to the same server as Next.js via a custom `server.ts` file.

---

## Internationalization (i18n)

A simple system to support **multiple languages**. All UI text lives in JSON files (`src/i18n/locales/en.json`). Instead of hardcoding text:

```tsx
<button>Sign In</button>
```

We use a translation function:

```tsx
<button>{t("common.signIn")}</button>
```

The `t()` function looks up `"common.signIn"` in the JSON file and returns `"Sign In"`. To add Spanish, you'd create `es.json` with `"common.signIn": "Iniciar sesión"` and the same code would work in both languages.

---

## Infrastructure

### Docker & Docker Compose
**Docker** packages software into **containers** — isolated environments that work the same everywhere. Instead of installing PostgreSQL on your machine, you run it in a container.

**Docker Compose** is a file (`docker-compose.yml`) that defines multiple containers at once. Ours defines:
- **postgres** — the database container
- **app** — the Next.js application container (for production)

For local development, you just need the postgres container. The app runs directly on your machine.

### The Dockerfile
A recipe for building the production container. It's a multi-stage build:
1. **deps** — install npm packages
2. **builder** — build the Next.js app
3. **runner** — copy only what's needed to run, creating a small final image

---

## File Upload

Profile photos are uploaded to the server and saved in `public/uploads/`. The API route:
1. Checks the file is an image (JPEG, PNG, or WebP)
2. Checks it's under 5MB
3. Gives it a unique random name
4. Saves it to disk
5. Stores the file path in the User record

---

## How It All Fits Together

Here's what happens when a user creates a post:

1. User fills out the form in the browser (**React component**)
2. **Zod** validates the form data client-side
3. Browser sends a `POST /api/posts` request to the server (**API route**)
4. Server checks the user is logged in (**NextAuth**)
5. **Zod** validates the data again server-side
6. **Prisma** saves the post to **PostgreSQL**
7. Server returns the new post as JSON
8. **React** updates the page to show the new post

And when someone sends a chat message:

1. User types and hits send (**React**)
2. Message appears immediately in their chat (**optimistic UI**)
3. Browser sends message to API route → **Prisma** saves to **PostgreSQL**
4. Browser also sends message via **Socket.io**
5. The other user's browser receives it instantly via Socket.io
6. **React** adds it to their chat view — no refresh needed

---

## Key Files Cheat Sheet

| File | Purpose |
|------|---------|
| `server.ts` | Custom server (Next.js + Socket.io) |
| `prisma/schema.prisma` | Database structure definition |
| `prisma/seed.ts` | Demo data for testing |
| `src/lib/auth.ts` | Authentication configuration |
| `src/lib/prisma.ts` | Database client |
| `src/lib/validations.ts` | Input validation rules |
| `src/app/page.tsx` | Landing page |
| `src/app/api/*/route.ts` | Backend API endpoints |
| `src/components/` | Reusable UI pieces |
| `src/i18n/locales/en.json` | All UI text (English) |
| `docker-compose.yml` | Container setup |
| `.env` | Secret configuration (not in git) |
