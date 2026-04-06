# ShackDesk-Backend

Backend services for ShackDesk desktop applications — hosted on Cloudflare Workers with D1 storage.

## Services

### Telemetry Worker (`workers/telemetry/`)

Accepts anonymous telemetry reports from ShackDesk apps via `POST https://telemetry.shackdesk.com/report`.

- No IP addresses stored
- No personally identifiable information collected
- Opt-in only — users must explicitly enable telemetry in the app
- All data retained for 90 days maximum

See [PRIVACY.md](PRIVACY.md) for the full data policy.

## Architecture

```
ShackDesk App (Windows)
        │
        │  POST /report (HTTPS)
        ▼
telemetry.shackdesk.com  ←── Cloudflare Worker (this repo)
        │
        │  INSERT
        ▼
  D1: shackdesk-telemetry
      └── reports table
```

## Local Development

**Prerequisites:** Node.js 18+, Wrangler CLI (`npm install -g wrangler`)

**Authenticate:**
```
wrangler login
```

**Create a `.dev.vars` file** (never committed — see `.gitignore`):
```
# No secrets required for the telemetry Worker currently.
# Future Workers may require API tokens here.
```

**Run locally:**
```
wrangler dev
```

This starts the Worker on `http://localhost:8787`. Wrangler creates a local SQLite database that mirrors the D1 schema for development.

**Test with curl:**
```bash
curl -X POST http://localhost:8787/report \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "test-guid-1234",
    "app": "PortPane",
    "version": "0.5.2-alpha",
    "event": "crash",
    "os": "Windows 10.0.19045",
    "timestamp": "2026-04-06T00:00:00Z",
    "props": { "exception": "NullReferenceException", "message": "Test" }
  }'
```

## Deployment

Deployment is automatic on push to `main` via GitHub Actions (see `.github/workflows/deploy.yml`).

Manual deployment:
```
wrangler deploy
```

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `CF_API_TOKEN` | Cloudflare API token with Workers and D1 write permissions |
| `CF_ACCOUNT_ID` | Cloudflare account ID |

See [MAINTENANCE.md](MAINTENANCE.md) for how to create and rotate these.

## DNS

`telemetry.shackdesk.com` must have a DNS CNAME record in the Cloudflare zone pointing at the Worker route. This is managed via `wrangler.toml` — Wrangler registers the route automatically on deploy. The DNS record must be proxied (orange cloud) in the Cloudflare dashboard.

## Repo Structure

```
ShackDesk-Backend/
  workers/
    telemetry/
      src/
        index.js          # Worker entry point
  wrangler.toml           # Cloudflare Worker config
  .github/
    workflows/
      deploy.yml          # CI deployment pipeline
  README.md
  SECURITY.md
  MAINTENANCE.md
  PRIVACY.md
  .gitignore
  .editorconfig
```
