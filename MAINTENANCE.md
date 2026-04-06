# Maintenance Guide — ShackDesk Backend

## Cloudflare API Token

The `CF_API_TOKEN` GitHub Actions secret authorises Wrangler to deploy Workers.

**To rotate:**
1. Cloudflare Dashboard → **My Profile → API Tokens → Create Token**
2. Use the **Edit Cloudflare Workers** template
3. Add D1 write permission if not included
4. Copy the token
5. GitHub → `Computer-Consultant/ShackDesk-Backend` → **Settings → Secrets → Actions**
6. Update `CF_API_TOKEN`
7. Delete the old token from the Cloudflare dashboard

**CF_ACCOUNT_ID** is not a secret but is stored as a GitHub secret for convenience. Find it on the Cloudflare dashboard right sidebar of any zone page.

## D1 Database

**Database name:** `shackdesk-telemetry`
**Database ID:** `e77c8a3d-cba7-4326-846c-faeb2c585da0`

### Query the database
```bash
wrangler d1 execute shackdesk-telemetry --remote --command="SELECT * FROM reports ORDER BY received_at DESC LIMIT 20;"
```

### Data retention — manual purge (90-day policy)
```bash
wrangler d1 execute shackdesk-telemetry --remote \
  --command="DELETE FROM reports WHERE received_at < datetime('now', '-90 days');"
```

This should be run periodically. Automating it via a Cloudflare Cron Trigger is a future improvement.

### Schema migrations

Schema changes require a migration file. Never alter the live schema directly without testing locally first.

1. Write the migration SQL
2. Test locally: `wrangler d1 execute shackdesk-telemetry --local --file=migration.sql`
3. Apply to production: `wrangler d1 execute shackdesk-telemetry --remote --file=migration.sql`
4. Commit the migration file to the repo under `db/migrations/`

## Adding a New Worker

1. Create `workers/<name>/src/index.js`
2. Add a new `[[routes]]` block and any bindings to `wrangler.toml`
3. If the new Worker needs its own D1 database, create it: `wrangler d1 create <db-name>`
4. Add a deploy step to `.github/workflows/deploy.yml` if it needs a separate pipeline

## Local Development

```bash
wrangler dev
```

Wrangler creates a local SQLite database at `.wrangler/state/`. This is gitignored.

To seed the local database with the schema:
```bash
wrangler d1 execute shackdesk-telemetry --local --file=db/schema.sql
```

## DNS

`telemetry.shackdesk.com` — CNAME record in the Cloudflare zone, proxied (orange cloud).
Wrangler registers the route automatically on deploy via `wrangler.toml`. If the route ever disappears, redeploy: `wrangler deploy`.

## Cloudflare Rate Limiting

Rate limiting is not in code — it is configured in the Cloudflare dashboard.

**Location:** Cloudflare Dashboard → shackdesk.com zone → **Security → WAF → Rate Limiting Rules**

**Free tier limit: 1 rule per account** (not per zone). The current rule is scoped to the
`/report` path. If additional Workers or routes are added in the future, consider updating
the rule expression to match the entire `telemetry.shackdesk.com` hostname instead:

- Broader expression: `http.host eq "telemetry.shackdesk.com"`

This covers all current and future routes on that subdomain without needing additional rules.
If Workers on other subdomains also need rate limiting, combine them with `or` in the same
rule, or upgrade to Pro (5 rules).

Current rule:
- Expression: `http.request.uri.path eq "/report"`
- Threshold: 10 requests per 10 seconds per IP (free tier minimum window)
- Action: Block for 10 seconds
