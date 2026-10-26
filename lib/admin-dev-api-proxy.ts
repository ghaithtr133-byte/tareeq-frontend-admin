const API_ORIGIN = "https://api.tareeq-academy.com";
const API_PREFIX = "/api/v1";
const APPROVED_UPSTREAM_ORIGIN = "https://admin.tareeq-academy.com";
const DEFAULT_LOCAL_ORIGIN = "http://localhost:3000";

export const ADMIN_DEV_API_PREFIX = "/__dev_api";
export const ADMIN_DEV_API_UPSTREAM = `${API_ORIGIN}${API_PREFIX}`;

const AUTH_METHODS: Record<string, readonly string[]> = {
  login: ["POST", "OPTIONS"],
  me: ["GET", "OPTIONS"],
  refresh: ["POST", "OPTIONS"],
  logout: ["POST", "OPTIONS"],
  "change-password": ["POST", "OPTIONS"],
};

const ADMIN_RESOURCES = new Set([
  "countries",
  "universities",
  "scholarships",
  "services",
  "articles",
]);

// The published contract specifies UUID formatting but does not constrain the
// UUID version. Accept every canonical UUID so a future backend UUID version
// is not rejected by the development-only path gate.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

// Node fetch transparently decodes upstream response bodies. Preserve the
// decoded body contract by not forwarding the obsolete encoding declaration.
const RESPONSE_HEADERS_TO_OMIT = new Set([...HOP_BY_HOP_HEADERS, "content-encoding"]);

export type AllowedDevApiEndpoint = {
  path: string;
  methods: readonly string[];
};

export type TrustedDevelopmentRequest =
  | { trusted: true; localOrigin: string }
  | { trusted: false };

/** The route remains in the build, but it cannot forward requests in production. */
export function isAdminDevApiProxyEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.NODE_ENV === "development" && getTrustedLocalOrigin(environment) !== undefined;
}

/**
 * An alternate port must be explicitly configured on the local server. The
 * value is deliberately server-only and limited to an HTTP localhost origin.
 */
export function getTrustedLocalOrigin(environment: NodeJS.ProcessEnv = process.env): string | undefined {
  const configuredOrigin = environment.ADMIN_DEV_PROXY_LOCAL_ORIGIN ?? DEFAULT_LOCAL_ORIGIN;

  try {
    const parsed = new URL(configuredOrigin);
    if (
      parsed.protocol !== "http:"
      || parsed.hostname !== "localhost"
      || !parsed.port
      || parsed.pathname !== "/"
      || parsed.search
      || parsed.hash
    ) {
      return undefined;
    }
    return parsed.origin;
  } catch {
    return undefined;
  }
}

function originFromReferer(referer: string | null): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/**
 * This is the local boundary for the Backend-approved Origin normalization.
 * Every request must target the explicitly configured loopback host. Requests
 * that change state must also prove their local Origin and Referer before the
 * proxy replaces those two headers for the approved upstream.
 */
export function validateTrustedDevelopmentRequest(
  requestHeaders: Headers,
  method: string,
  environment: NodeJS.ProcessEnv = process.env,
): TrustedDevelopmentRequest {
  const localOrigin = getTrustedLocalOrigin(environment);
  if (!localOrigin) return { trusted: false };

  const localHost = new URL(localOrigin).host;
  if (requestHeaders.get("host")?.toLowerCase() !== localHost) return { trusted: false };

  const requestOrigin = requestHeaders.get("origin");
  if (requestOrigin && requestOrigin !== localOrigin) return { trusted: false };

  const referer = requestHeaders.get("referer");
  if (referer && originFromReferer(referer) !== localOrigin) return { trusted: false };

  if (["POST", "PATCH"].includes(method) && (requestOrigin !== localOrigin || originFromReferer(referer) !== localOrigin)) {
    return { trusted: false };
  }

  return { trusted: true, localOrigin };
}

/**
 * Allows only the published authentication, health, and Admin content routes.
 * No user-provided host or arbitrary path can reach the upstream service.
 */
export function getAllowedDevApiEndpoint(segments: readonly string[]): AllowedDevApiEndpoint | undefined {
  if (segments.length === 1 && segments[0] === "health") {
    return { path: "/health", methods: ["GET", "OPTIONS"] };
  }

  if (segments.length === 2 && segments[0] === "auth") {
    const methods = AUTH_METHODS[segments[1]];
    return methods ? { path: `/auth/${segments[1]}`, methods } : undefined;
  }

  if (segments[0] !== "admin" || !ADMIN_RESOURCES.has(segments[1] ?? "")) {
    return undefined;
  }

  const resource = segments[1];
  if (segments.length === 2) {
    return { path: `/admin/${resource}`, methods: ["GET", "POST", "OPTIONS"] };
  }

  if (segments.length === 3 && UUID_PATTERN.test(segments[2])) {
    return { path: `/admin/${resource}/${segments[2]}`, methods: ["GET", "PATCH", "OPTIONS"] };
  }

  return undefined;
}

export function createUpstreamHeaders(requestHeaders: Headers): Headers {
  const headers = new Headers();
  for (const [name, value] of requestHeaders) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && name.toLowerCase() !== "host") {
      headers.set(name, value);
    }
  }
  return headers;
}

/**
 * Call only after validateTrustedDevelopmentRequest succeeds. The Backend has
 * explicitly authorized this development-only normalization; neither value is
 * copied from client-controlled request headers.
 */
export function createNormalizedUpstreamHeaders(requestHeaders: Headers): Headers {
  const headers = createUpstreamHeaders(requestHeaders);
  headers.set("origin", APPROVED_UPSTREAM_ORIGIN);
  headers.set("referer", `${APPROVED_UPSTREAM_ORIGIN}/`);
  return headers;
}

/**
 * The Backend documents host-only cookies. Keep every security attribute and
 * only map the API cookie path to the same-origin development route when it is
 * explicitly scoped to `/api/v1`. An unexpected Domain attribute is removed
 * so the browser keeps the cookie host-only for localhost rather than rejecting
 * it as a foreign-domain cookie.
 */
export function adaptDevelopmentSetCookie(setCookie: string): string {
  return setCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => !/^domain\s*=/i.test(part))
    .map((part) => {
      const path = /^path\s*=\s*(\/api\/v1)(\/.*)?$/i.exec(part);
      return path ? `Path=${ADMIN_DEV_API_PREFIX}${path[2] ?? ""}` : part;
    })
    .join("; ");
}

export function getSetCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  return withGetSetCookie.getSetCookie?.() ?? [];
}

export function createProxyResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();
  for (const [name, value] of upstreamHeaders) {
    const normalizedName = name.toLowerCase();
    if (!RESPONSE_HEADERS_TO_OMIT.has(normalizedName) && normalizedName !== "set-cookie") {
      headers.set(name, value);
    }
  }

  for (const setCookie of getSetCookieHeaders(upstreamHeaders)) {
    headers.append("set-cookie", adaptDevelopmentSetCookie(setCookie));
  }

  // Authenticated API responses must not be stored by the browser or an intermediary.
  headers.set("cache-control", "no-store");
  return headers;
}
