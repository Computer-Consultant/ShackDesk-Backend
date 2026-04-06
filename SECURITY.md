# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ShackDesk-Backend, please report it privately.

**Do not open a public GitHub issue for security vulnerabilities.**

Open a private security advisory at:
`https://github.com/Computer-Consultant/ShackDesk-Backend/security/advisories/new`

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect an acknowledgement within 72 hours and a resolution or mitigation plan within 14 days.

## Security Design

### No PII Stored

The telemetry Worker explicitly does not store:
- IP addresses (not even hashed)
- User identifiers or callsigns
- File paths or system usernames
- Device serial numbers or MAC addresses

### Rate Limiting

Rate limiting is enforced at the Cloudflare zone level, not in Worker code. This avoids any need to track or store client IPs. Configure rate limiting rules in the Cloudflare dashboard under **Security → WAF → Rate Limiting Rules**.

Recommended rule:
- Path: `/report`
- Threshold: 30 requests per minute per IP
- Action: Block for 1 minute

### Input Validation

All incoming payloads are validated for:
- Required fields presence and type
- Field length limits (prevents oversized payloads)
- Valid JSON structure

### Payload Size

The `props` field is capped at 4 KB. The Worker returns 400 if the limit is exceeded.

### Duplicate Reports

The `report_id` field is the D1 primary key. Duplicate submissions (e.g. from the app's offline queue retrying) are silently ignored via `ON CONFLICT DO NOTHING`.

### Transport Security

All traffic is HTTPS only. The `telemetry.shackdesk.com` subdomain is served through Cloudflare's proxy (orange cloud), which enforces TLS 1.2+ and provides DDoS protection.

### Secrets Management

No secrets are stored in code or `wrangler.toml`. Cloudflare API tokens for deployment are stored as GitHub Actions secrets only. Rotate them via the Cloudflare dashboard — see [MAINTENANCE.md](MAINTENANCE.md).

## Supported Versions

Only the current `main` branch deployment is supported. There are no versioned releases of the backend.
