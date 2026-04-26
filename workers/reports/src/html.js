export function renderDashboard() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ShackDesk Reports</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f8;
      --panel: #ffffff;
      --ink: #18201d;
      --muted: #5e6964;
      --line: #d8dedb;
      --accent: #0f766e;
      --accent-strong: #0b5f59;
      --danger: #b42318;
      --soft: #e8f3f1;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    header {
      background: #ffffff;
      border-bottom: 1px solid var(--line);
    }

    .wrap {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 22px 0;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: 0;
    }

    .subtle {
      color: var(--muted);
      font-size: 0.92rem;
    }

    main {
      padding: 24px 0 40px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }

    .metric,
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .metric {
      padding: 16px;
      min-height: 98px;
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 0.86rem;
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 2rem;
      line-height: 1;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 18px;
      align-items: start;
    }

    .panel {
      padding: 16px;
    }

    .panel h2 {
      margin: 0 0 14px;
      font-size: 1rem;
      letter-spacing: 0;
    }

    form {
      display: grid;
      grid-template-columns: repeat(4, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    label {
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 650;
    }

    input,
    select,
    button {
      width: 100%;
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      color: var(--ink);
      font: inherit;
    }

    input,
    select {
      padding: 8px 9px;
    }

    button {
      cursor: pointer;
      border-color: var(--accent);
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
    }

    button:hover {
      background: var(--accent-strong);
    }

    .button-row {
      align-self: end;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .secondary {
      background: #ffffff;
      color: var(--accent);
    }

    .secondary:hover {
      background: var(--soft);
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      background: #ffffff;
    }

    th,
    td {
      padding: 10px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 0.9rem;
    }

    th {
      background: #eef4f2;
      color: #26332f;
      font-size: 0.78rem;
      text-transform: uppercase;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    tr[data-report-id] {
      cursor: pointer;
    }

    tr[data-report-id]:hover {
      background: #f2faf8;
    }

    .event-crash {
      color: var(--danger);
      font-weight: 700;
    }

    .detail pre {
      margin: 0;
      max-height: 500px;
      overflow: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #101815;
      color: #eef7f4;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.82rem;
    }

    .mini-table {
      min-width: 0;
      margin-bottom: 18px;
    }

    .status {
      min-height: 24px;
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .error {
      color: var(--danger);
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .summary,
      .grid,
      form {
        grid-template-columns: 1fr;
      }

      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap topbar">
      <div>
        <h1>ShackDesk Reports</h1>
        <div class="subtle">Private telemetry review</div>
      </div>
      <div class="subtle" id="refreshed">Loading...</div>
    </div>
  </header>

  <main class="wrap">
    <section class="summary" aria-label="Summary">
      <div class="metric"><span>Total reports</span><strong id="totalReports">0</strong></div>
      <div class="metric"><span>Last 24 hours</span><strong id="reports24h">0</strong></div>
      <div class="metric"><span>Last 7 days</span><strong id="reports7d">0</strong></div>
      <div class="metric"><span>Crash reports</span><strong id="crashReports">0</strong></div>
      <div class="metric"><span>Known installs</span><strong id="uniqueInstalls">0</strong></div>
      <div class="metric"><span>Total runs</span><strong id="totalRuns">0</strong></div>
    </section>

    <div class="grid">
      <section class="panel">
        <h2>Reports</h2>
        <form id="filters">
          <label>App<select name="app"><option value="">Any</option></select></label>
          <label>Version<select name="version"><option value="">Any</option></select></label>
          <label>Event<select name="event"><option value="">Any</option></select></label>
          <label>OS<select name="os"><option value="">Any</option></select></label>
          <label>From<input name="from" type="datetime-local"></label>
          <label>To<input name="to" type="datetime-local"></label>
          <label>Search<input name="q" type="search" placeholder="id, app, event, props"></label>
          <label>Limit<input name="limit" type="number" min="1" max="200" value="50"></label>
          <div class="button-row">
            <button type="submit">Apply</button>
            <button class="secondary" type="button" id="reset">Reset</button>
          </div>
        </form>
        <p class="status" id="status">Loading reports...</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>App</th>
                <th>Version</th>
                <th>Event</th>
                <th>OS</th>
                <th>Install ID</th>
              </tr>
            </thead>
            <tbody id="reportsBody"></tbody>
          </table>
        </div>
      </section>

      <aside>
        <section class="panel detail">
          <h2>Report Detail</h2>
          <pre id="detail">Select a report to view the full payload.</pre>
        </section>
        <section class="panel" style="margin-top:18px">
          <h2>Events, Last 30 Days</h2>
          <table class="mini-table">
            <tbody id="eventsBody"></tbody>
          </table>
          <h2>Runs and Installs</h2>
          <table class="mini-table">
            <tbody id="runsBody"></tbody>
          </table>
          <h2>Crashes by App/Version</h2>
          <table class="mini-table">
            <tbody id="crashesBody"></tbody>
          </table>
        </section>
      </aside>
    </div>
  </main>

  <script>
    const form = document.querySelector("#filters");
    const statusEl = document.querySelector("#status");
    const reportsBody = document.querySelector("#reportsBody");
    const detail = document.querySelector("#detail");

    async function loadAll() {
      try {
        const [summary, options] = await Promise.all([
          fetchJson("/api/summary"),
          fetchJson("/api/options"),
        ]);

        renderSummary(summary);
        renderOptions(options);
        await loadReports();
        document.querySelector("#refreshed").textContent = "Refreshed " + new Date().toLocaleString();
      } catch (error) {
        showError(error);
      }
    }

    async function loadReports() {
      statusEl.textContent = "Loading reports...";
      statusEl.className = "status";
      const params = new URLSearchParams(new FormData(form));

      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key);
      }

      const reports = await fetchJson("/api/reports?" + params.toString());
      renderReports(reports);
      statusEl.textContent = reports.length + " report" + (reports.length === 1 ? "" : "s");
    }

    async function fetchJson(path) {
      const response = await fetch(path, { headers: { "Accept": "application/json" } });
      if (!response.ok) {
        throw new Error("Request failed: " + response.status);
      }
      return response.json();
    }

    function renderSummary(summary) {
      document.querySelector("#totalReports").textContent = number(summary.totalReports);
      document.querySelector("#reports24h").textContent = number(summary.reports24h);
      document.querySelector("#reports7d").textContent = number(summary.reports7d);
      document.querySelector("#crashReports").textContent = number(summary.crashReports);
      document.querySelector("#uniqueInstalls").textContent = number(summary.uniqueInstalls);
      document.querySelector("#totalRuns").textContent = number(summary.totalRuns);
      renderMiniTable("#eventsBody", summary.eventBreakdown, ["event", "total"]);
      renderRunProgress(summary.runProgress);
      renderMiniTable("#crashesBody", summary.crashByAppVersion, ["app", "version", "crashes"]);
    }

    function renderOptions(options) {
      setOptions("app", options.apps);
      setOptions("version", options.versions);
      setOptions("event", options.events);
      setOptions("os", options.operatingSystems);
    }

    function setOptions(name, values) {
      const select = form.elements[name];
      const current = select.value;
      select.innerHTML = '<option value="">Any</option>' + values.map((value) => {
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
      }).join("");
      select.value = current;
    }

    function renderReports(reports) {
      reportsBody.innerHTML = reports.map((report) => {
        const eventClass = report.event === "crash" ? "event-crash" : "";
        return '<tr data-report-id="' + escapeHtml(report.id) + '">' +
          '<td>' + escapeHtml(formatDate(report.receivedAt)) + '</td>' +
          '<td>' + escapeHtml(report.app) + '</td>' +
          '<td>' + escapeHtml(report.version) + '</td>' +
          '<td class="' + eventClass + '">' + escapeHtml(report.event) + '</td>' +
          '<td>' + escapeHtml(report.os || "") + '</td>' +
          '<td>' + escapeHtml(report.installId || "") + '</td>' +
        '</tr>';
      }).join("");
    }

    function renderMiniTable(selector, rows, fields) {
      const body = document.querySelector(selector);
      if (!rows.length) {
        body.innerHTML = '<tr><td class="subtle">No data</td></tr>';
        return;
      }

      body.innerHTML = rows.map((row) => {
        return '<tr>' + fields.map((field) => '<td>' + escapeHtml(row[field]) + '</td>').join("") + '</tr>';
      }).join("");
    }

    function renderRunProgress(rows) {
      const body = document.querySelector("#runsBody");
      if (!rows.length) {
        body.innerHTML = '<tr><td class="subtle">No data</td></tr>';
        return;
      }

      body.innerHTML = rows.slice(-10).reverse().map((row) => {
        return '<tr>' +
          '<td>' + escapeHtml(row.day) + '</td>' +
          '<td>' + number(row.total_runs) + ' runs</td>' +
          '<td>' + number(row.unique_installs) + ' installs</td>' +
        '</tr>';
      }).join("");
    }

    reportsBody.addEventListener("click", async (event) => {
      const row = event.target.closest("tr[data-report-id]");
      if (!row) return;

      detail.textContent = "Loading...";
      try {
        const report = await fetchJson("/api/reports/" + encodeURIComponent(row.dataset.reportId));
        detail.textContent = JSON.stringify(report, null, 2);
      } catch (error) {
        detail.textContent = error.message;
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      loadReports().catch(showError);
    });

    document.querySelector("#reset").addEventListener("click", () => {
      form.reset();
      form.elements.limit.value = "50";
      loadReports().catch(showError);
    });

    function showError(error) {
      statusEl.textContent = error.message;
      statusEl.className = "status error";
    }

    function number(value) {
      return new Intl.NumberFormat().format(value || 0);
    }

    function formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char]));
    }

    loadAll();
  </script>
</body>
</html>`;
}
