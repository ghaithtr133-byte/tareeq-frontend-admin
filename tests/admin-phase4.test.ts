import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { phase4Api } from "@/api/phase4";
import { queryKeys } from "@/api/query-keys";
import { normalizeApiError } from "@/api/error";
import { accountParamsSchema, accountUpdateSchema, analyticsParamsSchema, analyticsSummarySchema, auditParamsSchema, journeyParamsSchema, journeySchema } from "@/lib/phase4-schemas";
import { assertSuperAdminSession, clearPrivilegedCache } from "@/lib/privileged-access";
import { actionLabel, formatCount, formatRate, safeAnalyticsPath, safeAuditMetadata, trendPoints } from "@/lib/phase4-presentation";
import { cacheAccountUpdate } from "@/hook/mutations/use-account-mutation";
import { getAllowedDevApiEndpoint, isAdminDevApiProxyEnabled, validateTrustedDevelopmentRequest } from "@/lib/admin-dev-api-proxy";
import { accountFixture, actorId, auditFixture, journeyFixture, summaryFixture, targetId } from "./fixtures/phase4";

test("five exact operations map cookie credentials, query parameters and one-field PATCH envelopes", async () => {
  const old = apiClient.defaults.adapter; const calls: { method?: string; path?: string; params: unknown; body: unknown }[] = [];
  apiClient.defaults.adapter = async config => {
    assert.equal(config.withCredentials, true); calls.push({ method: config.method, path: config.url, params: config.params, body: config.data });
    const data = config.url?.endsWith("summary") ? summaryFixture : config.url?.endsWith("journeys") ? journeyFixture : config.url === "/admin/audit-logs" ? { items: [auditFixture], pagination: { page: 2, limit: 20, total: 21, totalPages: 2 } } : config.method === "patch" ? accountFixture : { items: [accountFixture], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data } };
  };
  try { assert.equal((await phase4Api.summary({ from: "2026-11-01", to: "2026-11-02", granularity: "week", topLimit: 5 })).conversionRates.clientReportedSessionRate, 6.47); await phase4Api.journeys({ page: 2, limit: 20 }); await phase4Api.accounts({ page: 1, limit: 20 }); await phase4Api.updateAccount(targetId, { isActive: false }); assert.equal((await phase4Api.audit({ actorId, action: "content.country.status_changed", resourceType: "COUNTRY", from: "2026-11-01T00:00:00Z", to: "2026-11-02T23:59:59Z", page: 2 })).pagination.totalPages, 2); }
  finally { apiClient.defaults.adapter = old; }
  assert.deepEqual(calls.map(call => `${call.method} ${call.path}`), ["get /admin/analytics/summary", "get /admin/analytics/journeys", "get /admin/users", `patch /admin/users/${targetId}`, "get /admin/audit-logs"]); assert.deepEqual(calls[0].params, { from: "2026-11-01", to: "2026-11-02", granularity: "week", topLimit: 5 }); assert.equal(calls[3].body, '{"isActive":false}');
});
test("bounded inclusive Analytics dates, exact filters and separate pagination caps", () => {
  assert.deepEqual(analyticsParamsSchema.parse({}), { granularity: "day", topLimit: 10 }); assert.equal(analyticsParamsSchema.safeParse({ from: "2024-01-01", to: "2024-12-31" }).success, true);
  for (const input of [{ from: "2024-01-01", to: "2025-01-01" }, { from: "2026-11-02", to: "2026-11-01" }, { from: "2026-02-30" }, { granularity: "year" }, { topLimit: 26 }, { visitorId: actorId }]) assert.equal(analyticsParamsSchema.safeParse(input).success, false);
  assert.equal(journeyParamsSchema.safeParse({ limit: 21 }).success, false); assert.equal(accountParamsSchema.safeParse({ search: "unsupported" }).success, false); assert.equal(accountParamsSchema.safeParse({ limit: 51 }).success, false);
  for (const input of [{ sort: "oldest" }, { action: "not valid" }, { actorId: "bad" }, { limit: 101 }, { from: "2026-11-02T00:00:00Z", to: "2026-11-01T00:00:00Z" }]) assert.equal(auditParamsSchema.safeParse(input).success, false);
});
test("metrics preserve raw counts/rates, zero/null/missing distinctions and exact chart values", () => {
  assert.equal(formatRate(6.47), `${new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(6.47)}٪`); assert.equal(formatCount(0), new Intl.NumberFormat("ar").format(0)); assert.equal(formatCount(undefined), "غير متاح"); assert.equal(formatRate(null), "غير متاح");
  assert.equal(analyticsSummarySchema.safeParse({ ...summaryFixture, totals: { ...summaryFixture.totals, pageViews: null } }).success, false); assert.equal(analyticsSummarySchema.safeParse({ ...summaryFixture, conversionRates: undefined }).success, false);
  const rows = [...summaryFixture.trends].reverse(); const before = JSON.stringify(rows); const points = trendPoints(rows, "pageViews"); assert.deepEqual(points.map(point => point.value), [12, 20]); assert.equal(points[0].y, 78); assert.equal(JSON.stringify(rows), before); assert.deepEqual(trendPoints([], "pageViews"), []); assert.equal(trendPoints([{ ...rows[0], pageViews: 0 }], "pageViews")[0].y, 150);
  assert.equal(journeySchema.safeParse(journeyFixture).success, true); // Only opaque disputed fields are excluded from validation.
});
test("account update is exactly one role or activation flag; invalid writes never reach Axios", async () => {
  for (const input of [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }, { isActive: true }, { isActive: false }]) assert.equal(accountUpdateSchema.safeParse(input).success, true);
  const old = apiClient.defaults.adapter; let calls = 0; apiClient.defaults.adapter = async () => { calls++; throw new Error("must not reach network"); };
  try { for (const input of [{}, { role: "OWNER" }, { isActive: "false" }, { role: "ADMIN", isActive: false }, { password: "not supported" }]) await assert.rejects(phase4Api.updateAccount(targetId, input as never)); await assert.rejects(phase4Api.updateAccount("bad", { role: "ADMIN" })); assert.equal(calls, 0); }
  finally { apiClient.defaults.adapter = old; }
});
test("metadata view is bounded, enum/boolean-only and never mutates or dumps private structures", () => {
  const original = JSON.stringify(auditFixture.metadata); const view = safeAuditMetadata(auditFixture.metadata); assert.deepEqual(view.rows.map(row => row.value), ["DRAFT", "PUBLISHED"]); assert.equal(view.hasHiddenFields, true); const rendered = JSON.stringify(view); for (const privateValue of ["HIDDEN_PASSWORD", "HIDDEN_TOKEN", "HIDDEN_MESSAGE", "HIDDEN_COOKIE"]) assert.equal(rendered.includes(privateValue), false); assert.equal(JSON.stringify(auditFixture.metadata), original);
  assert.deepEqual(safeAuditMetadata({ fromRole: "untrusted free text", isActive: false, arbitrary: ["private"] }).rows, [{ label: "مفعّل", value: "لا" }]); assert.equal(actionLabel("content.country.status_changed"), "تغيير الحالة"); assert.equal(safeAnalyticsPath("/scholarships?email=private"), "مسار محجوب لسلامة العرض");
});
test("restricted cache guards deny ADMIN/errored/changed sessions and preserve unrelated phases", async () => {
  const client = new QueryClient(); client.setQueryData(queryKeys.session, { id: actorId, role: "SUPER_ADMIN" }); assert.doesNotThrow(() => assertSuperAdminSession(client, actorId));
  const own = queryKeys.admin.privileged.accountList(actorId, {}); const audit = queryKeys.admin.privileged.auditList(actorId, {}); const other = queryKeys.admin.content.list("countries", {}); const faq = queryKeys.admin.faqs.list({ scope: "GLOBAL" });
  for (const key of [own, audit, other, faq]) client.setQueryData(key, { items: [accountFixture], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }); await cacheAccountUpdate(client, actorId, { ...accountFixture, role: "SUPER_ADMIN" }); assert.equal(client.getQueryState(audit)?.isInvalidated, true); assert.equal(client.getQueryState(other)?.isInvalidated, false); assert.equal(client.getQueryState(faq)?.isInvalidated, false);
  await assert.rejects(client.fetchQuery({ queryKey: queryKeys.session, queryFn: async () => { throw new Error("Session unavailable"); }, retry: false })); assert.throws(() => assertSuperAdminSession(client, actorId));
  client.setQueryData(queryKeys.session, { id: actorId, role: "ADMIN" }); assert.throws(() => assertSuperAdminSession(client, actorId)); clearPrivilegedCache(client); assert.equal(client.getQueryData(own), undefined); assert.ok(client.getQueryData(other)); assert.ok(client.getQueryData(faq)); await cacheAccountUpdate(client, actorId, accountFixture); assert.equal(client.getQueryData(own), undefined); client.setQueryData(queryKeys.session, { id: targetId, role: "SUPER_ADMIN" }); assert.throws(() => assertSuperAdminSession(client, actorId)); client.clear();
});
test("400/401/403/404/409 and network/cancel errors preserve cause without replay", async () => {
  const old = apiClient.defaults.adapter;
  try { for (const status of [400, 401, 403, 404, 409, 415, 500]) { let calls = 0; const failure = new AxiosError("failed", "ERR_BAD_RESPONSE", undefined, undefined, { config: {} as never, status, statusText: "Error", headers: {}, data: { success: false, error: { code: status === 409 ? "LAST_ACTIVE_SUPER_ADMIN_REQUIRED" : "REQUEST_FAILED", message: "Failed", details: {} } } }); apiClient.defaults.adapter = async () => { calls++; throw failure; }; await assert.rejects(phase4Api.updateAccount(targetId, { role: "SUPER_ADMIN" }), error => normalizeApiError(error).status === status && normalizeApiError(error).cause === failure); assert.equal(calls, 1); }
    const cancel = new CanceledError(); apiClient.defaults.adapter = async () => { throw cancel; }; await assert.rejects(phase4Api.accounts({}), error => normalizeApiError(error).kind === "cancelled");
    const network = new AxiosError("Network failed", "ERR_NETWORK", undefined, {}); apiClient.defaults.adapter = async () => { throw network; }; await assert.rejects(phase4Api.audit({}), error => normalizeApiError(error).kind === "network" && normalizeApiError(error).cause === network); }
  finally { apiClient.defaults.adapter = old; }
});
test("proxy adds only five documented operations and preserves trusted-origin/production gate", () => {
  for (const path of ["admin/analytics/summary", "admin/analytics/journeys", "admin/users", "admin/audit-logs"]) assert.deepEqual(getAllowedDevApiEndpoint(path.split("/"))?.methods, ["GET", "OPTIONS"]); assert.deepEqual(getAllowedDevApiEndpoint(["admin", "users", targetId])?.methods, ["PATCH", "OPTIONS"]);
  for (const path of ["analytics/events", "admin/analytics/private", "admin/users/new", `admin/users/${targetId}/sessions`, `admin/audit-logs/${targetId}`]) assert.equal(getAllowedDevApiEndpoint(path.split("/")), undefined);
  assert.equal(isAdminDevApiProxyEnabled({ NODE_ENV: "production" } as NodeJS.ProcessEnv), false); assert.equal(validateTrustedDevelopmentRequest(new Headers({ host: "localhost:3001" }), "PATCH", { NODE_ENV: "development", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3001" } as NodeJS.ProcessEnv).trusted, false);
});
