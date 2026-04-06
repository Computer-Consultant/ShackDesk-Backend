-- ShackDesk Backend — D1 Schema
-- Database: shackdesk-telemetry
--
-- Apply to production: wrangler d1 execute shackdesk-telemetry --remote --file=db/schema.sql
-- Apply locally:       wrangler d1 execute shackdesk-telemetry --local  --file=db/schema.sql
--
-- This file reflects the current live schema.
-- For changes, add a migration file under db/migrations/ and update this file to match.

CREATE TABLE IF NOT EXISTS reports (
    id               TEXT PRIMARY KEY,   -- report_id GUID from the app payload
    app              TEXT NOT NULL,      -- e.g. "PortPane", "RigCheck"
    version          TEXT NOT NULL,      -- app version string
    event            TEXT NOT NULL,      -- e.g. "crash", "device_detection", "startup"
    os               TEXT,               -- Windows version string
    props            TEXT,               -- JSON blob — event-specific fields
    client_timestamp TEXT,               -- ISO 8601 UTC — when the event occurred
    received_at      TEXT NOT NULL       -- ISO 8601 UTC — when the Worker received it
);

CREATE INDEX IF NOT EXISTS idx_app      ON reports (app);
CREATE INDEX IF NOT EXISTS idx_event    ON reports (event);
CREATE INDEX IF NOT EXISTS idx_received ON reports (received_at);
