# Deploying xarxa on your MacBook

## Prerequisites

- [Node.js 18+](https://nodejs.org/) — install via `brew install node` or from the website
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) — for PostgreSQL
- Git (comes with macOS, or `brew install git`)

## First-time setup

### 1. Clone the repo

```bash
git clone https://github.com/ltanzi/xarxa.git
cd xarxa
```

### 2. Start PostgreSQL

Make sure Docker Desktop is running, then:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on port 5432. It will keep running in the background.

### 3. Create your .env file

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` manually:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/xarxa
NEXTAUTH_SECRET=change-me-to-any-random-string
NEXTAUTH_URL=http://localhost:3000
```

For `NEXTAUTH_SECRET`, any random string works. You can generate one with:
```bash
openssl rand -base64 32
```

If you want Google OAuth to work, also add:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Otherwise, Google login won't work (but email/password login will).

### 4. First deploy

```bash
./deploy.sh --fresh
```

This installs dependencies, sets up the database, seeds it with demo data, and starts the app.

Open http://localhost:3000 — you should see xarxa.

### Demo accounts (all password: `password123`)
- maria@example.com
- info@associaciolliure.org
- pau@example.com
- laia@example.com
- hola@colectiuverd.cat

## Sharing with friends

### Option A: Same WiFi network

If your friends are on the same WiFi, they can access your Mac's local IP:

1. Find your IP: **System Settings > Wi-Fi > Details > IP Address** (or run `ipconfig getifaddr en0`)
2. Share: `http://192.168.X.X:3000`
3. Update `.env`: set `NEXTAUTH_URL=http://192.168.X.X:3000`
4. Restart the server

### Option B: Public URL with Cloudflare Tunnel (recommended)

Works for anyone, anywhere. Free, no account needed.

```bash
# Install once
brew install cloudflared

# Run in a separate terminal (keep it open while sharing)
cloudflared tunnel --url http://localhost:3000
```

It will print something like:
```
https://some-random-words.trycloudflare.com
```

Share that URL with your friends. It works as long as the tunnel is running.

## Updating after changes

When you've pushed new code from the work server:

```bash
./deploy.sh
```

This pulls the latest code, installs any new dependencies, applies schema changes, and starts the server.

If you want to wipe the database and start fresh:

```bash
./deploy.sh --fresh
```

## Stopping

- **Stop the app**: `Ctrl+C` in the terminal
- **Stop PostgreSQL**: `docker compose down`
- **Restart PostgreSQL later**: `docker compose up -d postgres`

## Troubleshooting

**Port 3000 already in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**Database connection refused?**
Make sure Docker Desktop is running and PostgreSQL is up:
```bash
docker compose up -d postgres
```

**Prisma errors after schema changes?**
Run with `--fresh` to reset:
```bash
./deploy.sh --fresh
```
