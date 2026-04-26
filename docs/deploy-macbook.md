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
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Generate a proper secret:
```bash
openssl rand -base64 32
```
Copy the output and paste it as the `NEXTAUTH_SECRET` value.

For `NEXTAUTH_SECRET`, any random string works. You can generate one with:
```bash
openssl rand -base64 32
```

### 4. First deploy

```bash
./deploy.sh --fresh
```

This installs dependencies, sets up the database, seeds it with demo data, and starts the app.

Open http://localhost:3000 — you should see xarxa.

### Demo accounts (all password: `Password1!`)
- info@foc.cat (F O C — collective)
- hola@caninofm.com (Canino FM — collective)
- emma@example.com (Emma Whitfield — legal)
- marc@example.com (Marc Puig — manual work)
- sofia@example.com (Sofia Romero — violin)

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

## Keeping it running for a week or two

For a friends beta you usually want xarxa reachable around the clock without
babysitting two open terminal windows. Two pieces have to stay alive: the
Next.js server (`npm run dev`) and the Cloudflare tunnel (`cloudflared`). The
Mac itself also has to stay awake.

### 1. Run each process in a tmux session

`tmux` lets you start a process, detach from it, and come back later — even
after closing the terminal or rebooting your shell.

```bash
# Install once
brew install tmux

# Start a session for the app
tmux new -s xarxa
# inside the session, run:
./deploy.sh
# leave it running, then detach:  Ctrl+B then D
```

In a second session, do the same for the tunnel:

```bash
tmux new -s tunnel
cloudflared tunnel --url http://localhost:3000
# detach:  Ctrl+B then D
```

Useful commands:
- `tmux ls` — list running sessions
- `tmux attach -t xarxa` — re-attach to a session to view logs or restart
- `tmux kill-session -t xarxa` — stop a session

You can close Terminal.app entirely and the sessions keep running. Open a new
Terminal a day later, run `tmux attach -t xarxa`, and you're back where you
left it.

### 2. Stop the Mac from sleeping

The cleanest one-shot way is `caffeinate`:

```bash
# In its own tmux session, so it survives a closed terminal:
tmux new -s awake
caffeinate -dims
# Ctrl+B then D to detach
```

Flags: `-d` keeps display awake, `-i` prevents idle sleep, `-m` prevents disk
sleep, `-s` prevents system sleep when on AC power. While `caffeinate` is
running, your Mac won't sleep at all.

If you'd rather configure it in System Settings (more permanent, no terminal
needed):

- **System Settings → Lock Screen** — set "Start Screen Saver when inactive"
  and "Turn display off on power adapter when inactive" to **Never**
- **System Settings → Battery → Options** — toggle "Prevent automatic sleeping
  on power adapter when display is off" **on**
- Keep the Mac plugged in. (You can close the lid only with an external
  display attached, or use a tool like Amphetamine or InsomniaX. Otherwise
  leave the lid open.)

### 3. Survive a reboot or crash

If the Mac restarts (power loss, update, kernel panic), tmux sessions are
gone and you'd need to start everything by hand. For a one- or two-week
beta this is usually fine — just `tmux attach` after a reboot and restart
the three sessions.

If you'd like restart-on-failure plus auto-start at login, look at `pm2`
(Node-friendly, simple) or `launchd` plists (built-in, more setup). Out of
scope for this guide.

### 4. Quick health check

To confirm everything's up:

```bash
curl -sI http://localhost:3000 | head -1   # local server
tmux ls                                     # all sessions present
pgrep -a caffeinate                         # caffeinate running
```

The tunnel URL printed by `cloudflared` should also load in a browser. If a
piece is down, `tmux attach -t <name>` to see what happened.

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
