/**
 * ShackDesk Telemetry Worker
 *
 * Accepts POST /report from ShackDesk desktop applications.
 * Validates the payload and writes to the D1 `reports` table.
 *
 * No IP addresses are stored. No PII is collected.
 * See PRIVACY.md for the full data policy.
 *
 * Rate limiting is handled by Cloudflare's zone-level rate limiting rules,
 * not in this Worker — keeps the code simple and avoids any IP storage.
 */

const REQUIRED_FIELDS = ["report_id", "app", "version", "event", "os", "timestamp"];

// Maximum lengths to prevent abuse — generous enough for any legitimate payload
const FIELD_LIMITS = {
  report_id: 64,
  app:       64,
  version:   32,
  event:     64,
  os:        128,
  props:     4096, // serialised JSON string
};

export default {
  async fetch(request, env) {
    // Only POST /report is accepted
    if (request.method !== "POST") {
      return response(405, "Method Not Allowed");
    }

    const url = new URL(request.url);
    if (url.pathname !== "/report") {
      return response(404, "Not Found");
    }

    // Require JSON content type
    const contentType = request.headers.get("Content-Type") ?? "";
    if (!contentType.includes("application/json")) {
      return response(415, "Content-Type must be application/json");
    }

    // Parse body
    let payload;
    try {
      payload = await request.json();
    } catch {
      return response(400, "Invalid JSON");
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!payload[field] || typeof payload[field] !== "string") {
        return response(400, `Missing or invalid field: ${field}`);
      }
    }

    // Enforce field length limits
    for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
      if (field === "props") continue; // handled separately below
      if (payload[field] && payload[field].length > limit) {
        return response(400, `Field too long: ${field}`);
      }
    }

    // Serialise props — accept object or omit
    let propsJson = null;
    if (payload.props !== undefined) {
      try {
        propsJson = JSON.stringify(payload.props);
        if (propsJson.length > FIELD_LIMITS.props) {
          return response(400, "props payload too large");
        }
      } catch {
        return response(400, "Invalid props value");
      }
    }

    // Write to D1
    try {
      await env.DB.prepare(`
        INSERT INTO reports (id, app, version, event, os, props, client_timestamp, received_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
      `).bind(
        payload.report_id,
        payload.app,
        payload.version,
        payload.event,
        payload.os,
        propsJson,
        payload.timestamp,
        new Date().toISOString()
      ).run();
    } catch (err) {
      console.error("D1 write failed:", err);
      return response(500, "Internal Server Error");
    }

    return response(200, "OK");
  },
};

function response(status, message) {
  return new Response(JSON.stringify({ status, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
