const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const TEXT_FIELDS = ["id", "app", "version", "event", "os", "props"];
const INSTALL_ID_EXPR = `
  COALESCE(
    json_extract(props, '$.install_id'),
    json_extract(props, '$.installation_id'),
    json_extract(props, '$.installId'),
    json_extract(props, '$.installationId'),
    json_extract(props, '$.client_id'),
    json_extract(props, '$.clientId'),
    json_extract(props, '$.anonymous_id'),
    json_extract(props, '$.anonymousId'),
    json_extract(props, '$.support_id'),
    json_extract(props, '$.supportId')
  )
`;

export async function getSummary(db) {
  const [totals, eventBreakdown, crashVersions, runProgress] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS total_reports,
        SUM(CASE WHEN received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day') THEN 1 ELSE 0 END) AS reports_24h,
        SUM(CASE WHEN received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-7 days') THEN 1 ELSE 0 END) AS reports_7d,
        SUM(CASE WHEN event = 'crash' THEN 1 ELSE 0 END) AS crash_reports,
        SUM(CASE WHEN event = 'app_start' THEN 1 ELSE 0 END) AS total_runs,
        SUM(CASE WHEN event = 'app_start' AND received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 day') THEN 1 ELSE 0 END) AS runs_24h,
        SUM(CASE WHEN event = 'app_start' AND received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-7 days') THEN 1 ELSE 0 END) AS runs_7d,
        COUNT(DISTINCT ${INSTALL_ID_EXPR}) AS unique_installs
      FROM reports
    `).first(),
    db.prepare(`
      SELECT event, COUNT(*) AS total
      FROM reports
      WHERE received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-30 days')
      GROUP BY event
      ORDER BY total DESC, event ASC
    `).all(),
    db.prepare(`
      SELECT app, version, COUNT(*) AS crashes
      FROM reports
      WHERE event = 'crash'
      GROUP BY app, version
      ORDER BY crashes DESC, app ASC, version ASC
      LIMIT 20
    `).all(),
    db.prepare(`
      SELECT
        substr(received_at, 1, 10) AS day,
        COUNT(CASE WHEN event = 'app_start' THEN 1 END) AS total_runs,
        COUNT(DISTINCT CASE WHEN ${INSTALL_ID_EXPR} IS NOT NULL THEN ${INSTALL_ID_EXPR} END) AS unique_installs
      FROM reports
      WHERE received_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all(),
  ]);

  return {
    totalReports: Number(totals?.total_reports || 0),
    reports24h: Number(totals?.reports_24h || 0),
    reports7d: Number(totals?.reports_7d || 0),
    crashReports: Number(totals?.crash_reports || 0),
    totalRuns: Number(totals?.total_runs || 0),
    runs24h: Number(totals?.runs_24h || 0),
    runs7d: Number(totals?.runs_7d || 0),
    uniqueInstalls: Number(totals?.unique_installs || 0),
    eventBreakdown: normalizeRows(eventBreakdown.results),
    crashByAppVersion: normalizeRows(crashVersions.results),
    runProgress: normalizeRows(runProgress.results),
  };
}

export async function getOptions(db) {
  const [apps, versions, events, operatingSystems] = await Promise.all([
    distinctValues(db, "app"),
    distinctValues(db, "version"),
    distinctValues(db, "event"),
    distinctValues(db, "os"),
  ]);

  return { apps, versions, events, operatingSystems };
}

export async function getReports(db, searchParams) {
  const filters = buildFilters(searchParams);
  const { whereSql, params } = buildWhereClause(filters);
  const limit = clampLimit(searchParams.get("limit"));

  const rows = await db.prepare(`
    SELECT id, app, version, event, os, props, client_timestamp, received_at
    FROM reports
    ${whereSql}
    ORDER BY received_at DESC
    LIMIT ?
  `).bind(...params, limit).all();

  return normalizeRows(rows.results).map(normalizeReport);
}

export async function getReportById(db, id) {
  const row = await db.prepare(`
    SELECT id, app, version, event, os, props, client_timestamp, received_at
    FROM reports
    WHERE id = ?
  `).bind(id).first();

  return row ? normalizeReport(row) : null;
}

function buildFilters(searchParams) {
  return {
    app: cleanParam(searchParams.get("app")),
    version: cleanParam(searchParams.get("version")),
    event: cleanParam(searchParams.get("event")),
    os: cleanParam(searchParams.get("os")),
    from: cleanParam(searchParams.get("from")),
    to: cleanParam(searchParams.get("to")),
    q: cleanParam(searchParams.get("q")),
  };
}

function buildWhereClause(filters) {
  const clauses = [];
  const params = [];

  for (const field of ["app", "version", "event", "os"]) {
    if (filters[field]) {
      clauses.push(`${field} = ?`);
      params.push(filters[field]);
    }
  }

  if (filters.from) {
    clauses.push("received_at >= ?");
    params.push(filters.from);
  }

  if (filters.to) {
    clauses.push("received_at <= ?");
    params.push(filters.to);
  }

  if (filters.q) {
    const like = `%${escapeLike(filters.q)}%`;
    clauses.push(`(${TEXT_FIELDS.map((field) => `${field} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    params.push(...TEXT_FIELDS.map(() => like));
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

async function distinctValues(db, field) {
  const rows = await db.prepare(`
    SELECT DISTINCT ${field} AS value
    FROM reports
    WHERE ${field} IS NOT NULL AND ${field} != ''
    ORDER BY ${field} ASC
    LIMIT 200
  `).all();

  return normalizeRows(rows.results).map((row) => row.value);
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function normalizeReport(row) {
  return {
    id: row.id,
    app: row.app,
    version: row.version,
    event: row.event,
    os: row.os,
    props: parseProps(row.props),
    clientTimestamp: row.client_timestamp,
    receivedAt: row.received_at,
  };
}

function parseProps(props) {
  if (!props) return null;

  try {
    return JSON.parse(props);
  } catch {
    return props;
  }
}

function clampLimit(value) {
  const parsed = Number.parseInt(value || `${DEFAULT_LIMIT}`, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function cleanParam(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
