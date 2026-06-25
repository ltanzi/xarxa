# Resume from here — next session

**Last commit on `worktree-go-live`:** `4e80457` (chore(sentry): debug=true on server.ts init)

## Where we are in the original plan

- Phase A (app code): ✅ complete
- Phase B (prod config): ✅ complete
- Phase C (accounts): ✅ complete
- Phase D (box bootstrap): ✅ complete
- Phase E (DNS): ✅ complete
- Phase F (first deploy): ✅ complete, live at https://xarxa.help
- **Phase G (monitoring): IN PROGRESS — Sentry SDK wired but events not landing**
- Phase H (backups): partial — wrapper + cron installed, first B2 dump confirmed; restore drill pending
- Phase I (docs + merge): pending

## Phase G status

### What works
- `@sentry/nextjs` installed
- `sentry.{client,server,edge}.config.ts` + `src/instrumentation.ts` in place
- `next.config.mjs` wrapped with `withSentryConfig` (source-map upload)
- `experimental.instrumentationHook: true` enabled
- Server SDK init **moved into `server.ts`** because our custom server bypasses Next.js's automatic instrumentation hook for the Node runtime
- Server SDK init confirmed firing — boot logs show "Initializing Sentry... Integration installed: ..." (40+ integrations)
- CSP `connect-src` allows `https://*.ingest.sentry.io https://sentry.io`
- DSN points at correct EU project (`o4511622380912640.ingest.de.sentry.io/4511622390612048`)
- Smoke endpoint at `/api/sentry-test` returns 500 with explicit `Sentry.captureException(err); await Sentry.flush(2000); throw err;`
- Outbound HTTPS to Sentry from the container works (manual `https.request` got a meaningful 401 auth-error response)

### What doesn't
- **Events aren't appearing in the Sentry dashboard** (`xarxa.sentry.io/issues/?project=4511622390612048` still shows "Get Started with Sentry Issues")
- The smoke endpoint's HTTP 500 confirms server-side execution reached Sentry's `withScope` (stack trace shows `@sentry/opentelemetry`), so the SDK is on the path

### What to do next (resume here)

1. **Continue capturing debug logs around the smoke.** Last session I added `debug: true` to the init and re-deployed. The init logs flooded (which is why we cut off). Need to filter for the actual *send* events:
   ```bash
   ssh xarxa-prod 'cd /opt/xarxa && docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml logs --tail 200 app 2>&1' \
     > /tmp/sentry-debug.log
   grep -iE "envelope|sending|discarded|sample|drop|transport" /tmp/sentry-debug.log | head -40
   ```
   Look for one of:
   - `Sending envelope` — event went out (check Sentry inbox filter, project mismatch, time range)
   - `Discarded event` — sample rate / beforeSend / inboundFilter dropping it
   - `Transport error` — network or auth issue

2. **If `Sending envelope` is present but Sentry shows nothing**: check `https://xarxa.sentry.io/settings/projects/xarxa/` for project DSN; compare to the runtime DSN. The DSN in `/etc/xarxa/.env` was generated when the Sentry project was first created — possibly a different project than the one the user is viewing.

3. **If `Discarded` is present**: the integration name in the discard message tells us why. Most likely culprit: `InboundFilters` if `xarxa sentry smoke` is on Sentry's default ignore list (unlikely), or our explicit `tracesSampleRate: 0.1` shouldn't affect captureException (errors are not sampled by `tracesSampleRate`).

4. **Once the smoke event actually lands in Sentry:**
   - Delete `src/app/api/sentry-test/route.ts`
   - Remove `debug: true` from both `server.ts` init and `sentry.server.config.ts`
   - Commit "remove sentry smoke route + debug flag"

### After Phase G — remaining work

- **Phase G.3 — UptimeRobot**: user already has an account from C4. Add an HTTPS monitor for `https://xarxa.help/` with 5-min interval, alert to `leo.tanzi@gmail.com`. ~5 min.
- **Phase H.3 — restore drill**: pull latest dump from B2, decrypt with backup key (in operator's password manager), psql into throwaway local Postgres, row-count compare with prod. The runbook in `docs/runbook.md` §4 has the exact recipe. ~20 min.
- **Phase I — finish:**
  - README.md: add live URL above the screenshot
  - PR #2 review-comments table → check off the 4 Critical + 15 Important findings in PR description
  - Merge `worktree-go-live` → `main` via `gh pr merge 2 --squash` (or the user does it via GitHub UI to keep all 30+ commits visible)
  - Then UI changes per "I have some things that I want to modify in the graphic interface"

### Useful state to know

- Deploy command on box: `cd /opt/xarxa && ./deploy-prod.sh` (or `--keep-head` for rollback)
- Latest commit on branch: `4e80457` 
- PR: https://github.com/ltanzi/xarxa/pull/2 (37 → ~50+ files changed by now)
- Box: `ssh xarxa-prod` (alias for `xarxa@167.233.204.178`)
- OPERATOR_EMAIL fixed to `leo.tanzi@gmail.com` mid-session
- Backup smoke confirmed: `xarxa-pg-20260625-142253.sql.gpg` in `b2:xarxa-backups/postgres/`
