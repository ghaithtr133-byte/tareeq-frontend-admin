import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { faqApi, faqParams, loadFaqOrder } from "@/api/faqs";
import { siteSettingsApi } from "@/api/site-settings";
import { normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import { faqCreateSchema, faqGroupSchema, faqOrderSchema, faqScopes, faqUpdateSchema } from "@/lib/faq-schemas";
import { faqFormPayload, faqFormValues } from "@/lib/faq-form";
import { settingsChanges, settingsFields, settingsValues, siteSettingsSchema, siteSettingsUpdateSchema } from "@/lib/site-settings-schemas";
import { canEditSiteSettings, invalidateSiteSettings } from "@/hook/mutations/use-site-settings-mutation";
import { invalidateFaqGroup } from "@/hook/mutations/use-faq-mutation";
import { createPublicSettingsHeaders, getAllowedDevApiEndpoint, isAdminDevApiProxyEnabled, validateTrustedDevelopmentRequest } from "@/lib/admin-dev-api-proxy";
import { faqFixture, faqId, parentIds, settingsFixture } from "./fixtures/site-management";

test("six exact operations, envelope mapping, credentialed writes and credential-free public GET", async () => {
  const old = apiClient.defaults.adapter; const calls: string[] = [];
  apiClient.defaults.adapter = async config => {
    calls.push(`${config.method} ${config.url}`); assert.equal(config.withCredentials, config.url === "/site-settings" ? false : true);
    if (config.method === "patch" || config.method === "post") assert.equal(config.headers.get("Content-Type"), "application/json");
    const data = config.url?.includes("site-settings") ? settingsFixture : config.url?.endsWith("/order") ? { items: [faqFixture] } : config.method === "get" ? { items: [faqFixture], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } } : faqFixture;
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data } };
  };
  try { assert.equal((await faqApi.list({ scope: "GLOBAL" })).items[0].answerEn, faqFixture.answerEn); await faqApi.create({ scope: "GLOBAL", questionAr: "سؤال", answerAr: "إجابة" }); await faqApi.update(faqId, { questionEn: null, status: "PUBLISHED" }); await faqApi.reorder({ scope: "GLOBAL" }, [faqId]); assert.deepEqual(await siteSettingsApi.get(), settingsFixture); await siteSettingsApi.update({ addressAr: null }); }
  finally { apiClient.defaults.adapter = old; }
  assert.deepEqual(calls, ["get /admin/faqs", "post /admin/faqs", `patch /admin/faqs/${faqId}`, "patch /admin/faqs/order", "get /site-settings", "patch /admin/site-settings"]);
});
test("FAQ scoped query defaults, enum, UUID, pagination and immutable fields", () => {
  assert.deepEqual(faqParams({ scope: "GLOBAL" }), { scope: "GLOBAL", parentId: undefined, page: 1, limit: 50 });
  for (const scope of faqScopes) { const parentId = scope === "GLOBAL" ? undefined : parentIds[scope]; assert.equal(faqGroupSchema.safeParse({ scope, parentId }).success, true); assert.equal(faqCreateSchema.safeParse({ scope, parentId, questionAr: "سؤال", answerAr: "إجابة" }).success, true); }
  for (const input of [{ scope: "GLOBAL", parentId: parentIds.COUNTRY }, { scope: "COUNTRY" }, { scope: "ARTICLE" }, { scope: "COUNTRY", parentId: "wrong" }]) assert.equal(faqGroupSchema.safeParse(input).success, false);
  for (const input of [{ scope: "GLOBAL", limit: 101 }, { scope: "GLOBAL", page: 0 }, { scope: "GLOBAL", search: "unsupported" }]) assert.throws(() => faqParams(input as never));
  for (const input of [{ scope: "GLOBAL" }, { parentId: null }, { displayOrder: 4 }, {}]) assert.equal(faqUpdateSchema.safeParse(input).success, false);
  assert.equal(faqOrderSchema.safeParse({ scope: "GLOBAL", orderedIds: [] }).success, false); assert.equal(faqOrderSchema.safeParse({ scope: "GLOBAL", orderedIds: [faqId, faqId] }).success, false);
});
test("FAQ bilingual input limits and omitted/empty/null partial semantics", () => {
  for (const [field, value] of [["questionAr", "x"], ["answerAr", "x"], ["questionAr", "x".repeat(501)], ["answerAr", "x".repeat(10001)], ["questionEn", ""], ["answerEn", "x"]]) assert.equal(faqCreateSchema.safeParse({ scope: "GLOBAL", questionAr: "سؤال", answerAr: "إجابة", [field]: value }).success, false);
  const group = { scope: "GLOBAL" as const }; const values = faqFormValues(faqFixture);
  assert.deepEqual(faqFormPayload(group, { ...values, answerAr: "إجابة معدلة" }, faqFixture), { answerAr: "إجابة معدلة" });
  assert.deepEqual(faqFormPayload(group, values, faqFixture, ["answerEn"]), { answerEn: null });
  assert.throws(() => faqFormPayload(group, { ...values, answerEn: "" }, faqFixture));
  assert.deepEqual(faqFormPayload(group, { ...faqFormValues(), questionAr: "سؤال", answerAr: "إجابة" }), { scope: "GLOBAL", questionAr: "سؤال", answerAr: "إجابة", status: "DRAFT" });
});
test("FAQ complete order spans pages, excludes archived and enforces scope/parent isolation", async () => {
  const old = apiClient.defaults.adapter; let wrongParent = false; let staleTotal = false; let calls = 0;
  apiClient.defaults.adapter = async config => { calls++; const page = config.params.page; assert.equal(config.params.status, undefined); const record = { ...faqFixture, scope: "COUNTRY", parentId: wrongParent ? parentIds.UNIVERSITY : parentIds.COUNTRY };
    const items = page === 1 ? Array.from({ length: 100 }, (_, index) => ({ ...record, id: `f0000000-0000-4000-8000-${String(index + 1000).padStart(12, "0")}`, status: "ARCHIVED" })) : [record];
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: { items, pagination: { page, limit: 100, total: staleTotal && page === 2 ? 102 : 101, totalPages: 2 } } } };
  };
  try { const group = { scope: "COUNTRY" as const, parentId: parentIds.COUNTRY }; assert.deepEqual((await loadFaqOrder(group)).map(faq => faq.id), [faqId]); assert.equal(calls, 2); wrongParent = true; await assert.rejects(loadFaqOrder(group)); wrongParent = false; staleTotal = true; await assert.rejects(loadFaqOrder(group)); }
  finally { apiClient.defaults.adapter = old; }
  assert.notDeepEqual(queryKeys.admin.faqs.group({ scope: "COUNTRY", parentId: parentIds.COUNTRY }), queryKeys.admin.faqs.group({ scope: "UNIVERSITY", parentId: parentIds.UNIVERSITY }));
});
test("Settings schema covers exactly ten editable fields and all-null initialization", () => {
  const allNull = Object.fromEntries([...settingsFields.map(field => [field.name, null]), ["updatedAt", null]]); assert.equal(siteSettingsSchema.safeParse(allNull).success, true); assert.equal(settingsFields.length, 10);
  for (const bad of [{ updatedAt: null }, { apiKey: "secret" }, { contactPhone: "123" }, { academyNameAr: "" }, { facebookUrl: "not a URI" }]) assert.equal(siteSettingsUpdateSchema.safeParse(bad).success, false);
  assert.equal(siteSettingsUpdateSchema.safeParse({ contactEmail: "" }).success, true); // Exact PATCH schema has maxLength, no email format; no silent null conversion.
  assert.equal(siteSettingsUpdateSchema.safeParse({ contactPhone: "+962 700 000 000", addressAr: null }).success, true);
  assert.equal(siteSettingsSchema.safeParse({ ...settingsFixture, contactEmail: "invalid" }).success, false);
});
test("Settings PATCH sends changed fields only and clearing is explicit", () => {
  const values = settingsValues(settingsFixture); assert.throws(() => settingsChanges(settingsFixture, values, []));
  assert.deepEqual(settingsChanges(settingsFixture, { ...values, academyNameAr: "اسم جديد" }, []), { academyNameAr: "اسم جديد" });
  assert.deepEqual(settingsChanges(settingsFixture, values, ["instagramUrl"]), { instagramUrl: null });
  assert.deepEqual(settingsChanges(settingsFixture, { ...values, contactEmail: "" }, []), { contactEmail: "" });
  assert.throws(() => settingsChanges(settingsFixture, values, ["addressAr"])); // Already null is unchanged.
  assert.equal(canEditSiteSettings("ADMIN"), false); assert.equal(canEditSiteSettings("SUPER_ADMIN"), true); assert.equal(canEditSiteSettings(undefined), false);
});
test("Phase 3 errors preserve status/cause and do not replay failed writes", async () => {
  const old = apiClient.defaults.adapter;
  try { for (const status of [400, 401, 403, 404, 409, 415, 500]) { let calls = 0; const failure = new AxiosError("failed", "ERR_BAD_RESPONSE", undefined, undefined, { config: {} as never, status, statusText: "Error", headers: {}, data: { success: false, error: { code: "REQUEST_FAILED", message: "Failed", details: {} } } }); apiClient.defaults.adapter = async () => { calls++; throw failure; }; await assert.rejects(faqApi.update(faqId, { status: "ARCHIVED" }), error => normalizeApiError(error).status === status && normalizeApiError(error).cause === failure); assert.equal(calls, 1); await assert.rejects(siteSettingsApi.update({ addressAr: null }), error => normalizeApiError(error).status === status); assert.equal(calls, 2); }
    apiClient.defaults.adapter = async () => { throw new CanceledError(); }; await assert.rejects(siteSettingsApi.get(), error => normalizeApiError(error).kind === "cancelled"); }
  finally { apiClient.defaults.adapter = old; }
});
test("narrow proxy surface, production exclusion, trusted writes and public credential stripping", () => {
  for (const [path, methods] of [["admin/faqs", ["GET", "POST", "OPTIONS"]], [`admin/faqs/${faqId}`, ["PATCH", "OPTIONS"]], ["admin/faqs/order", ["PATCH", "OPTIONS"]], ["site-settings", ["GET", "OPTIONS"]], ["admin/site-settings", ["PATCH", "OPTIONS"]]] as const) assert.deepEqual(getAllowedDevApiEndpoint(path.split("/"))?.methods, methods);
  for (const path of ["admin/faqs/arbitrary", "admin/faqs/order/extra", "admin/site-settings/extra", "site-settings/extra"]) assert.equal(getAllowedDevApiEndpoint(path.split("/")), undefined);
  assert.equal(isAdminDevApiProxyEnabled({ NODE_ENV: "production" } as NodeJS.ProcessEnv), false);
  assert.equal(validateTrustedDevelopmentRequest(new Headers({ host: "localhost:3001", origin: "https://untrusted.invalid", referer: "https://untrusted.invalid/" }), "PATCH", { NODE_ENV: "development", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3001" } as NodeJS.ProcessEnv).trusted, false);
  const publicHeaders = createPublicSettingsHeaders(); assert.deepEqual([...publicHeaders.keys()], ["accept"]); for (const key of ["cookie", "authorization", "x-csrf-token"]) assert.equal(publicHeaders.has(key), false);
});
test("FAQ and settings invalidation never refresh unrelated Phase 1/2 or FAQ groups", async () => {
  const client = new QueryClient(); const group = { scope: "COUNTRY" as const, parentId: parentIds.COUNTRY }; const own = queryKeys.admin.faqs.list({ ...group, page: 1 }); const other = queryKeys.admin.faqs.list({ scope: "UNIVERSITY", parentId: parentIds.UNIVERSITY }); const old = queryKeys.admin.submissions.list("applications", {});
  for (const key of [own, other, old, queryKeys.admin.settings]) client.setQueryData(key, []); await invalidateFaqGroup(client, group);
  assert.equal(client.getQueryState(own)?.isInvalidated, true); for (const key of [other, old, queryKeys.admin.settings]) assert.equal(client.getQueryState(key)?.isInvalidated, false);
  await invalidateSiteSettings(client); assert.equal(client.getQueryState(queryKeys.admin.settings)?.isInvalidated, true); assert.equal(client.getQueryState(old)?.isInvalidated, false); assert.equal(client.getQueryState(other)?.isInvalidated, false); client.clear();
});
