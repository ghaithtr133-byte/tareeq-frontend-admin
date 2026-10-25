import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptDevelopmentSetCookie,
  ADMIN_DEV_API_PREFIX,
  ADMIN_DEV_API_UPSTREAM,
  createProxyResponseHeaders,
  createUpstreamHeaders,
  getAllowedDevApiEndpoint,
  isAdminDevApiProxyEnabled,
} from "@/lib/admin-dev-api-proxy";

const recordId = "00000000-0000-4000-8000-000000000001";

test("development proxy has a fixed upstream and is unavailable in production", () => {
  assert.equal(ADMIN_DEV_API_UPSTREAM, "https://api.tareeq-academy.com/api/v1");
  assert.equal(ADMIN_DEV_API_PREFIX, "/__dev_api");
  assert.equal(isAdminDevApiProxyEnabled({ NODE_ENV: "development" }), true);
  assert.equal(isAdminDevApiProxyEnabled({ NODE_ENV: "production" }), false);
});

test("development proxy only permits documented auth, health, and Admin content operations", () => {
  assert.deepEqual(getAllowedDevApiEndpoint(["health"]), { path: "/health", methods: ["GET", "OPTIONS"] });
  assert.deepEqual(getAllowedDevApiEndpoint(["auth", "login"]), { path: "/auth/login", methods: ["POST", "OPTIONS"] });
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "countries"]), { path: "/admin/countries", methods: ["GET", "POST", "OPTIONS"] });
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "countries", recordId]), { path: `/admin/countries/${recordId}`, methods: ["GET", "PATCH", "OPTIONS"] });
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "articles", "018f9d45-27b8-7cc2-8ee5-a8062a84c1d4"]), {
    path: "/admin/articles/018f9d45-27b8-7cc2-8ee5-a8062a84c1d4",
    methods: ["GET", "PATCH", "OPTIONS"],
  });
  assert.equal(getAllowedDevApiEndpoint(["admin", "countries", "not-a-uuid"]), undefined);
  assert.equal(getAllowedDevApiEndpoint(["https:", "untrusted.example"]), undefined);
  assert.equal(getAllowedDevApiEndpoint(["auth", "unknown"]), undefined);
});

test("development proxy preserves CSRF-relevant headers and safely adapts cookie paths", () => {
  const outgoing = createUpstreamHeaders(new Headers({
    cookie: "tareeq_access=opaque",
    origin: "http://localhost:3000",
    referer: "http://localhost:3000/admin/login",
    "x-request-id": "request-id",
    host: "localhost:3000",
    connection: "keep-alive",
  }));
  assert.equal(outgoing.get("cookie"), "tareeq_access=opaque");
  assert.equal(outgoing.get("origin"), "http://localhost:3000");
  assert.equal(outgoing.get("referer"), "http://localhost:3000/admin/login");
  assert.equal(outgoing.get("x-request-id"), "request-id");
  assert.equal(outgoing.get("host"), null);
  assert.equal(outgoing.get("connection"), null);

  assert.equal(
    adaptDevelopmentSetCookie("tareeq_access=opaque; Path=/api/v1; HttpOnly; Secure; SameSite=Lax"),
    "tareeq_access=opaque; Path=/__dev_api; HttpOnly; Secure; SameSite=Lax",
  );
  assert.equal(
    adaptDevelopmentSetCookie("tareeq_refresh=opaque; Domain=api.tareeq-academy.com; Path=/; HttpOnly; Secure; SameSite=Lax"),
    "tareeq_refresh=opaque; Path=/; HttpOnly; Secure; SameSite=Lax",
  );

  const headers = createProxyResponseHeaders(new Headers({
    "x-request-id": "request-id",
    "cache-control": "public",
    "content-encoding": "gzip",
  }));
  assert.equal(headers.get("x-request-id"), "request-id");
  assert.equal(headers.get("cache-control"), "no-store");
  assert.equal(headers.get("content-encoding"), null);
});
