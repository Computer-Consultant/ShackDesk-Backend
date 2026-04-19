import { requireBasicAuth } from "./auth.js";
import { renderDashboard } from "./html.js";
import { getOptions, getReportById, getReports, getSummary } from "./queries.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse(200, { status: "ok" });
    }

    const auth = requireBasicAuth(request, env);
    if (!auth.ok) {
      return auth.response;
    }

    try {
      if (request.method !== "GET") {
        return jsonResponse(405, { error: "Method Not Allowed" }, { Allow: "GET" });
      }

      if (url.pathname === "/") {
        return htmlResponse(renderDashboard());
      }

      if (url.pathname === "/api/summary") {
        return jsonResponse(200, await getSummary(env.DB));
      }

      if (url.pathname === "/api/options") {
        return jsonResponse(200, await getOptions(env.DB));
      }

      if (url.pathname === "/api/reports") {
        return jsonResponse(200, await getReports(env.DB, url.searchParams));
      }

      const detailMatch = url.pathname.match(/^\/api\/reports\/([^/]+)$/);
      if (detailMatch) {
        const report = await getReportById(env.DB, decodeURIComponent(detailMatch[1]));
        if (!report) {
          return jsonResponse(404, { error: "Report not found" });
        }
        return jsonResponse(200, report);
      }

      return jsonResponse(404, { error: "Not Found" });
    } catch (error) {
      console.error("Reports Worker failed:", error);
      return jsonResponse(500, { error: "Internal Server Error" });
    }
  },
};

function htmlResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
