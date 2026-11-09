import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { aboutChanges, aboutFields, aboutUpdateSchema, missingAboutPublicationFields } from "@/lib/about-schemas";
import { aboutApi } from "@/lib/api-client/about";
import { apiClient } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/api-client/query-keys";
import { navigationForRole } from "@/lib/admin";
import { getAllowedDevApiEndpoint, isAdminDevApiProxyEnabled } from "@/lib/admin-dev-api-proxy";
import { clearPrivateAdminCache } from "@/lib/admin-session-cache";
import { StaleContentSessionError } from "@/lib/content-session";
import { useAboutMutation } from "@/hook/mutations/use-about-mutation";
import { AdminAccessProvider } from "@/providers/admin-access-provider";
import { aboutFixture } from "./fixtures/about";

function reply(config: InternalAxiosRequestConfig, data: unknown) { return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data } }; }
function failure(config: InternalAxiosRequestConfig, status: number, code: string) { return new AxiosError("Synthetic failure", undefined, config, {}, { config, status, statusText: "Failure", headers: {}, data: { success: false, error: { code, message: "Synthetic failure", details: {} } } }); }

test("About navigation allows both roles, with no Marketing/Journey entry and only exact proxy methods", () => {
  for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
    const nav = navigationForRole(role);
    assert.equal(nav.filter(item => item.id === "about" && item.label === "من نحن").length, 1);
    assert.equal(nav.some(item => /marketing|journey/.test(item.id)), false);
  }
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "about"]), { path: "/admin/about", methods: ["GET", "PATCH", "OPTIONS"] });
  assert.equal(getAllowedDevApiEndpoint(["admin", "about", "other"]), undefined);
  assert.equal(isAdminDevApiProxyEnabled({ NODE_ENV: "production" }), false);
});

test("all editable fields validate lengths, URI and explicit null; Hero images and timestamps cannot be sent", () => {
  for (const [key, , max, kind] of aboutFields) {
    assert.equal(aboutUpdateSchema.safeParse({ [key]: null }).success, true, key);
    assert.equal(aboutUpdateSchema.safeParse({ [key]: "" }).success, false, key);
    assert.equal(aboutUpdateSchema.safeParse({ [key]: "x".repeat(max + 1) }).success, false, key);
    if (kind !== "url") assert.equal(aboutUpdateSchema.safeParse({ [key]: "x".repeat(max) }).success, true, key);
  }
  assert.equal(aboutUpdateSchema.safeParse({ introImageUrl: "not-a-uri" }).success, false);
  assert.equal(aboutUpdateSchema.safeParse({ introImageUrl: "https://example.invalid/introduction.png" }).success, true);
  for (const key of ["heroImageUrl", "heroImageAltAr", "heroImageAltEn", "publishedAt", "updatedAt", "createdAt"]) assert.equal(aboutUpdateSchema.safeParse({ [key]: "test" }).success, false, key);
});

test("changed-only PATCH keeps multiline Arabic and distinguishes explicit clear, omission and blank", () => {
  const introBodyAr = "سطر أول\n\nسطر ثانٍ";
  assert.deepEqual(aboutChanges(null, {}), { status: "DRAFT" });
  assert.deepEqual(aboutChanges(aboutFixture, { introBodyAr, missionTitleEn: null, introTitleEn: "" }), { introBodyAr, missionTitleEn: null });
  assert.deepEqual(aboutChanges(aboutFixture, { missionTitleEn: "" }), { missionTitleEn: "" });
  assert.deepEqual(aboutChanges(aboutFixture, { missionTitleEn: aboutFixture.missionTitleEn, status: "DRAFT" }), {});
});

test("publication checks merged Arabic only and rejects clearing required text while published", () => {
  const ready = { ...aboutFixture, heroTitleAr: "عنوان", heroSubtitleAr: "تمهيد", introTitleAr: "مقدمة", introBodyAr: "نص" };
  assert.deepEqual(missingAboutPublicationFields(aboutFixture, { status: "DRAFT" }), []);
  assert.deepEqual(missingAboutPublicationFields(aboutFixture, { status: "ARCHIVED" }), []);
  assert.deepEqual(missingAboutPublicationFields(ready, { status: "PUBLISHED" }), []);
  assert.deepEqual(missingAboutPublicationFields({ ...ready, status: "PUBLISHED" }, { introBodyAr: null }), ["introBodyAr"]);
  assert.deepEqual(missingAboutPublicationFields(aboutFixture, { status: "PUBLISHED", heroTitleAr: "   " }), ["heroTitleAr", "heroSubtitleAr", "introTitleAr", "introBodyAr"]);
});

test("authenticated GET treats only CONTENT_NOT_FOUND 404 as missing and passes abort signals", async () => {
  const original = apiClient.defaults.adapter; const signal = new AbortController().signal;
  const cases = [[404, "CONTENT_NOT_FOUND"], [404, "OTHER"], [401, "AUTHENTICATION_REQUIRED"], [403, "FORBIDDEN"], [500, "INTERNAL_SERVER_ERROR"], [0, "ERR_NETWORK"]] as const;
  try {
    for (const [status, code] of cases) {
      apiClient.defaults.adapter = async config => {
        assert.equal(config.url, "/admin/about"); assert.equal(config.method, "get"); assert.equal(config.withCredentials, true); assert.equal(config.signal, signal);
        if (!status) throw new AxiosError("Synthetic network failure", code, config, {});
        throw failure(config, status, code);
      };
      if (code === "CONTENT_NOT_FOUND") assert.equal(await aboutApi.get(signal), null);
      else await assert.rejects(aboutApi.get(signal), (error: AxiosError) => status ? error.response?.status === status : error.code === code);
    }
  } finally { apiClient.defaults.adapter = original; }
});

const actor = { id: "11111111-1111-4111-8111-111111111111", role: "ADMIN", name: "Local", email: "fixture@example.invalid" };
function saveHook(client: QueryClient) {
  let save!: ReturnType<typeof useAboutMutation>["save"];
  function Harness() { save = useAboutMutation().save; return null; }
  renderToString(<QueryClientProvider client={client}><AdminAccessProvider mockEnabled={false}><Harness /></AdminAccessProvider></QueryClientProvider>);
  return save;
}

for (const transition of ["none", "logout", "switch"] as const) test(`About PATCH completion: ${transition}`, async () => {
  const client = new QueryClient(); const key = queryKeys.admin.about(actor.id);
  client.setQueryData(queryKeys.session, actor); client.setQueryData(key, null);
  const save = saveHook(client); const original = apiClient.defaults.adapter;
  let start!: () => void; let release!: () => void;
  const started = new Promise<void>(resolve => { start = resolve; }); const gate = new Promise<void>(resolve => { release = resolve; });
  const saved = { ...aboutFixture, introBodyAr: "نص\nمتعدد الأسطر" };
  const otherKey = queryKeys.admin.about(aboutFixture.id);
  let writes = 0;
  apiClient.defaults.adapter = async config => {
    writes++; assert.equal(config.method, "patch"); assert.equal(config.url, "/admin/about"); assert.equal(config.withCredentials, true);
    assert.deepEqual(JSON.parse(config.data), { introBodyAr: saved.introBodyAr });
    start(); await gate; return reply(config, saved);
  };
  try {
    const pending = save({ introBodyAr: saved.introBodyAr });
    const settled = pending.then(data => ({ data }), error => ({ error })); await started;
    if (transition !== "none") { clearPrivateAdminCache(client); client.setQueryData(queryKeys.session, transition === "logout" ? null : { ...actor, id: aboutFixture.id }); }
    if (transition === "switch") client.setQueryData(otherKey, aboutFixture);
    release(); const result = await settled;
    assert.equal(writes, 1);
    if (transition === "none") {
      assert.deepEqual(result, { data: saved }); assert.deepEqual(client.getQueryData(key), saved); assert.equal(client.getQueryState(key)?.isInvalidated, true);
    } else {
      assert.ok("error" in result && result.error instanceof StaleContentSessionError);
      assert.equal(client.getQueryData(key), undefined);
      if (transition === "switch") { assert.deepEqual(client.getQueryData(otherKey), aboutFixture); assert.equal(client.getQueryState(otherKey)?.isInvalidated, false); }
    }
  } finally { apiClient.defaults.adapter = original; client.clear(); }
});
