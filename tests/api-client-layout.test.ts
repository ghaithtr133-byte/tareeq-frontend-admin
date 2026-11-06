import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client/client";
import { getAuthenticatedUser, login, logout, refreshSession, restoreAuthenticatedUser } from "@/lib/api-client/auth";

test("Backend helper modules live outside Vercel's root function directory and imports use their new path", () => {
  assert.equal(existsSync("api"), false);
  for (const name of ["auth", "client", "content", "error", "faqs", "images", "mock-content-repository", "phase4", "query-keys", "server-client", "site-settings", "submissions", "university-management"]) assert.ok(existsSync(`lib/api-client/${name}.ts`), name);
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (/\.(ts|tsx|mjs)$/.test(path)) assert.doesNotMatch(readFileSync(path, "utf8"), /["'](?:@\/|\.\.\/)api\//, path);
    }
  }
  for (const directory of ["app", "components", "hook", "lib", "providers", "tests"]) inspect(directory);
});

const user = { id: "11111111-1111-4111-8111-111111111111", name: "Local fixture", email: "fixture@example.invalid", role: "SUPER_ADMIN" as const };
test("relocated auth preserves cookie credentials, exact login/me/refresh/logout methods and a single API prefix", async () => {
  const previous = { adapter: apiClient.defaults.adapter, baseURL: apiClient.defaults.baseURL };
  const calls: string[] = [];
  apiClient.defaults.baseURL = "https://backend.example.invalid/api/v1";
  apiClient.defaults.adapter = async config => {
    assert.equal(config.withCredentials, true);
    calls.push(`${config.method} ${apiClient.getUri(config)}`);
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: { user } } };
  };
  try {
    assert.deepEqual(await login({ email: user.email, password: "synthetic-only" }), user);
    assert.deepEqual(await getAuthenticatedUser(), user);
    await Promise.all([refreshSession(), refreshSession()]);
    await logout();
    assert.deepEqual(calls, ["post https://backend.example.invalid/api/v1/auth/login", "get https://backend.example.invalid/api/v1/auth/me", "post https://backend.example.invalid/api/v1/auth/refresh", "post https://backend.example.invalid/api/v1/auth/logout"]);
  } finally { apiClient.defaults.adapter = previous.adapter; apiClient.defaults.baseURL = previous.baseURL; }
});

test("relocated session restoration still performs bounded refresh then authoritative me", async () => {
  const previous = apiClient.defaults.adapter; const calls: string[] = [];
  apiClient.defaults.adapter = async config => {
    calls.push(`${config.method} ${config.url}`);
    assert.equal(config.withCredentials, true);
    if (calls.length === 1) throw new AxiosError("synthetic expired session", undefined, config, {}, { config, status: 401, statusText: "Unauthorized", headers: {}, data: { success: false, error: { code: "AUTHENTICATION_REQUIRED", message: "synthetic" } } });
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: { user } } };
  };
  try {
    assert.deepEqual(await restoreAuthenticatedUser(), user);
    assert.deepEqual(calls, ["get /auth/me", "post /auth/refresh", "get /auth/me"]);
  } finally { apiClient.defaults.adapter = previous; }
});
