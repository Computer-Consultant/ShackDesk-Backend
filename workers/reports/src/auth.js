export function requireBasicAuth(request, env) {
  const expectedUser = env.REPORTS_USERNAME;
  const expectedPassword = env.REPORTS_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return {
      ok: false,
      response: jsonResponse(500, { error: "Reports credentials are not configured" }),
    };
  }

  const authorization = request.headers.get("Authorization") || "";
  const [scheme, encoded] = authorization.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return { ok: false, response: unauthorizedResponse() };
  }

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return { ok: false, response: unauthorizedResponse() };
  }

  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  if (!constantTimeEqual(username, expectedUser) || !constantTimeEqual(password, expectedPassword)) {
    return { ok: false, response: unauthorizedResponse() };
  }

  return { ok: true };
}

function unauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ShackDesk Reports", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function constantTimeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return difference === 0;
}
