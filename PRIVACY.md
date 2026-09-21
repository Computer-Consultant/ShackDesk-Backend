# Privacy Policy — ShackDesk Backend

**Last updated:** 2026-09-21

This document describes what data the ShackDesk backend services collect, store, and retain. It is intended to be read alongside the privacy policy of each ShackDesk application.

## Telemetry Endpoint (`POST /report`)

### What is collected

When a ShackDesk application sends a telemetry report, the following fields are stored:

| Field              | Example                          | Purpose                        |
|--------------------|----------------------------------|--------------------------------|
| `report_id`        | UUID                             | Deduplication                  |
| `app`              | `PortPane`                       | Identify the source application|
| `version`          | `0.5.2-alpha`                    | Track version distribution     |
| `event`            | `crash`                          | Event classification           |
| `os`               | `Windows 10.0.19045`             | OS version analytics           |
| `props`            | `{"exception":"...", ...}`       | Event-specific detail          |
| `client_timestamp` | `2026-04-06T12:00:00Z`           | When the event occurred        |
| `received_at`      | `2026-04-06T12:00:05Z`           | When the server received it    |

### What is never collected

- IP addresses — not stored, not hashed, not logged
- User identity — no callsign, name, or account
- File paths or directory names
- Device serial numbers or MAC addresses
- Any other personally identifiable information

### Opt-in only

Nothing is sent until the user has agreed. Each ShackDesk application asks on first launch whether it may send anonymous diagnostic reports. On alpha and beta test builds the option is pre-selected in that dialog, because test-build feedback is where the data matters most, but no report is sent until the user confirms the choice; on stable releases it is unselected. The choice can be changed at any time in the application's Settings, and each application lets the user view every report it has sent.

## Data Storage and Retention

- Data is stored in a Cloudflare D1 database (SQLite) hosted in Cloudflare's infrastructure
- All records are retained for a maximum of **90 days**
- No data is sold, shared, or transferred to third parties

## Contact

For privacy questions, open an issue at:
`https://github.com/Computer-Consultant/ShackDesk-Backend/issues`
