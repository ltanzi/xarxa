# xarxa — Production Runbook

Single-page incident response for `https://xarxa.org`.

> Specifics in `<angle brackets>` are filled in during Phase I after the box exists.

- **SSH:** `ssh xarxa-prod` (resolves via `~/.ssh/config` entry on the operator's workstation; host is `xarxa@<hetzner-box-ip>`)
- **App root on box:** `/opt/xarxa`
- **Secrets on box:** `/etc/xarxa/.env` (mode 600 xarxa), `/etc/xarxa/backup.key` (mode 400 root), `/etc/xarxa/backup.env` (mode 400 root)
- **Operator email for alerts:** `<operator-email>`

---

## 1. Site is down — decision tree

Run these in order. Each step narrows the failure to a specific layer.

1. **External reachability?**
   ```bash
   curl -sI https://xarxa.org
   ```
   - HTTPS 200 → site is up; the original report was wrong, the user's network, or a transient.
   - `Could not resolve host` → DNS issue. Check Cloudflare dashboard → DNS → `xarxa.org` A record points at the box IP.
   - Connection refused / timeout → box is down or Caddy isn't listening. Go to step 2.
   - 5xx response → Caddy reached the app and got an error. Go to step 4.

2. **Box reachable over SSH?**
   ```bash
   ssh xarxa-prod 'uptime; df -h /'
   ```
   - SSH fails → check Hetzner cloud console (https://console.hetzner.cloud) — is the server `Running`? If not, start it. If `Running` but unreachable, open the Hetzner web-console (KVM).
   - SSH works → continue to step 3.

3. **Containers running?**
   ```bash
   docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml ps
   ```
   - All three (`postgres`, `app`, `caddy`) Up → go to step 4.
   - One or more `Exit`/`Restarting` → see its logs:
     ```bash
     docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs --tail 200 <service>
     ```
   - `systemctl status xarxa.service` tells you if systemd believes the stack is up.

4. **App responding to Caddy?**
   ```bash
   docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs --tail 200 app
   ```
   - Stack trace → fix the bug, redeploy. If a recent commit broke things, rollback (§3).
   - "ECONNREFUSED postgres:5432" → Postgres is down or starting; check its logs.
   - "Invalid environment variables" → `/etc/xarxa/.env` has a missing/malformed value; fix and `docker compose ... up -d`.

5. **Disk full?**
   ```bash
   df -h /
   docker system df
   ```
   Reclaim with `docker system prune -af` (safe — only removes unused images/containers/networks).

---

## 2. Common commands

```bash
# Tail logs live
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs -f app
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs -f caddy

# Restart just the app (no DB/Caddy interruption)
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml restart app

# Restart everything (last resort; drops in-flight Socket.io connections)
sudo systemctl restart xarxa.service

# Force Caddy to reload (e.g., after Caddyfile edit)
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile

# Open a psql shell against prod DB
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml exec postgres psql -U xarxa -d xarxa

# Disk + Docker cleanup
df -h /
docker system prune -af

# What did we deploy last? (commit SHA appears in build args)
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml exec app printenv NEXT_PUBLIC_COMMIT_SHA
```

---

## 3. Rollback after a bad deploy

```bash
cd /opt/xarxa
git log -10 --oneline           # find the last-known-good SHA
git checkout <good-sha>
./deploy-prod.sh                # builds and swaps app
```

`deploy-prod.sh` won't pull/reset because we're now in detached-HEAD. After verifying, return to a branch:

```bash
git checkout -b hotfix-<topic>
# fix forward and merge to main; on the next ./deploy-prod.sh, git fetch+reset to origin/main resumes normal flow.
```

If the breakage was a bad migration that left the schema in a weird state, open psql (§2) and `\d` the table; reverse the column add by hand (the spec uses `prisma db push` so there are no migration files to roll back automatically).

---

## 4. Restore database from B2 backup

On a throwaway environment (your dev workstation, not prod):

```bash
mkdir -p /tmp/xarxa-restore && cd /tmp/xarxa-restore

# 1. Get the encryption passphrase from your password manager (item: "xarxa backup encryption key")
echo '<your-backup-key>' > .key && chmod 600 .key

# 2. Download the latest dump
rclone copy b2:xarxa-backups/postgres/ . --include "*.sql.gpg" --max-age 30h

# 3. Decrypt
gpg --batch --yes --passphrase-file .key --decrypt xarxa-pg-*.sql.gpg > restored.sql
rm .key

# 4. Spin up a throwaway Postgres and load
docker run --rm -d --name pg-restore -e POSTGRES_PASSWORD=restore -p 5433:5432 postgres:16-alpine
sleep 3
PGPASSWORD=restore psql -h localhost -p 5433 -U postgres -c 'CREATE DATABASE xarxa;'
PGPASSWORD=restore psql -h localhost -p 5433 -U postgres -d xarxa < restored.sql
PGPASSWORD=restore psql -h localhost -p 5433 -U postgres -d xarxa -c 'SELECT count(*) FROM "User"; SELECT count(*) FROM "Post";'

# 5. Compare row counts with prod (on the box)
ssh xarxa-prod docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml exec postgres psql -U xarxa xarxa -c 'SELECT count(*) FROM "User"; SELECT count(*) FROM "Post";'

# 6. Tear down
docker rm -f pg-restore
rm -rf /tmp/xarxa-restore
```

To actually restore *into* prod after a catastrophic loss: provision a fresh Hetzner box (Phase C–D from the plan), but during D2 skip the `db push --force-reset` step and instead `psql` the decrypted dump in directly.

---

## 5. Rotate `NEXTAUTH_SECRET`

When to do this: a leak is suspected, a contractor was offboarded, or just on routine schedule.

```bash
ssh xarxa-prod
sudo openssl rand -base64 64 | tr -d '\n' | sudo tee /tmp/new-secret > /dev/null
# Edit /etc/xarxa/.env, replace NEXTAUTH_SECRET with the new value
sudo nano /etc/xarxa/.env
# Restart only the app — all existing user sessions invalidate (expected)
docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml restart app
sudo rm /tmp/new-secret
```

Update your password manager entry too.

---

## 6. External links and dashboards

| Service | URL | What it shows |
|---|---|---|
| Hetzner Cloud | https://console.hetzner.cloud | Server status, weekly snapshots, network graphs |
| Cloudflare | https://dash.cloudflare.com | DNS records, domain registration, edge analytics |
| Resend | https://resend.com/dashboard | Sent / bounced / complained emails, deliverability |
| Sentry | https://sentry.io | Application errors, release tagging |
| UptimeRobot | https://uptimerobot.com | External liveness, response time |
| Backblaze B2 | https://secure.backblaze.com/b2_buckets.htm | Backup bucket contents and lifecycle |

---

## 7. Escalation — when to ask Claude for help

If you're stuck, restart the conversation in Claude Code from the worktree and include:

1. **Symptom**: what's broken and since when.
2. **Last 200 log lines**:
   ```bash
   docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs --tail 200 app > /tmp/app.log
   docker compose --env-file /etc/xarxa/.env -f /opt/xarxa/docker-compose.prod.yml logs --tail 200 caddy > /tmp/caddy.log
   ```
3. **Container state**: output of `docker compose ... ps` and `docker ps -a`.
4. **Sentry issue URL** if applicable.
5. **What you tried**: every command you've run since noticing the issue.

Don't reboot the box or destroy containers until you've shared the above — diagnostics evaporate on restart.
