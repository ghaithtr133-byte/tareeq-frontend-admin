import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/api-client/query-keys";
import { AdminAccessProvider } from "@/providers/admin-access-provider";
import { useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { clearPrivateAdminCache } from "@/lib/admin-session-cache";
import { StaleContentSessionError } from "@/lib/content-session";
import { useCreateContent } from "@/hook/mutations/use-content-mutations";
import { useChangePasswordMutation } from "@/hook/mutations/use-change-password-mutation";
import { AxiosError } from "axios";

const actor = { id: "11111111-1111-4111-8111-111111111111", role: "ADMIN", name: "Local", email: "local@example.invalid" };
const record = { id: "22222222-2222-4222-8222-222222222222", nameAr: "محلي", status: "DRAFT" };
function updateHook(client: QueryClient) {
  let save!: ReturnType<typeof useUpdateContent<"countries">>["mutateAsync"];
  function Harness() { save = useUpdateContent("countries").mutateAsync; return null; }
  renderToString(<QueryClientProvider client={client}><AdminAccessProvider mockEnabled={false}><Harness /></AdminAccessProvider></QueryClientProvider>);
  return save;
}

test("pending real core hook success after logout cannot recreate a private detail", async () => {
  const client = new QueryClient(); client.setQueryData(queryKeys.session, actor);
  const save = updateHook(client); const previous = apiClient.defaults.adapter;
  let started!: () => void; const begun = new Promise<void>(resolve => { started = resolve; });
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  apiClient.defaults.adapter = async config => { started(); await gate; return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: record } }; };
  try {
    const pending = save({ id: record.id, input: { nameAr: record.nameAr } }).catch(() => undefined);
    await begun; clearPrivateAdminCache(client); client.setQueryData(queryKeys.session, null);
    release(); await pending;
    assert.equal(client.getQueryData(queryKeys.admin.content.detail("countries", record.id)), undefined);
  } finally { apiClient.defaults.adapter = previous; client.clear(); }
});

for (const scenario of ["logout-failure", "switch-success", "same-user-new-session", "same-session-success", "same-session-failure", "create-after-logout"] as const) {
  test(`real core mutation ${scenario}: session-scoped completion and no replay`, async () => {
    const client = new QueryClient(); client.setQueryData(queryKeys.session, actor);
    let create!: ReturnType<typeof useCreateContent<"countries">>["mutateAsync"];
    function Harness() { create = useCreateContent("countries").mutateAsync; return null; }
    renderToString(<QueryClientProvider client={client}><AdminAccessProvider mockEnabled={false}><Harness /></AdminAccessProvider></QueryClientProvider>);
    const save = updateHook(client); const previous = apiClient.defaults.adapter;
    let start!: () => void; const began = new Promise<void>(resolve => { start = resolve; });
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    let calls = 0; let invalidations = 0;
    const invalidate = client.invalidateQueries.bind(client);
    client.invalidateQueries = (...args) => { invalidations++; return invalidate(...args); };
    apiClient.defaults.adapter = async config => {
      calls++; start(); await gate;
      if (scenario.endsWith("failure")) throw new AxiosError("synthetic", undefined, config, {}, { config, status: 400, statusText: "Bad Request", headers: {}, data: { success: false, error: { code: "VALIDATION_ERROR", message: "synthetic" } } });
      return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: record } };
    };
    try {
      const pending = (scenario === "create-after-logout" ? create({ nameAr: record.nameAr }) : save({ id: record.id, input: { nameAr: record.nameAr } })).then(value => ({ value, error: undefined }), error => ({ value: undefined, error }));
      await began;
      if (scenario === "same-user-new-session") { client.clear(); client.setQueryData(queryKeys.session, actor); }
      else if (scenario === "switch-success") client.setQueryData(queryKeys.session, { ...actor, id: "other-user" });
      else if (scenario === "logout-failure" || scenario === "create-after-logout") { clearPrivateAdminCache(client); client.setQueryData(queryKeys.session, null); }
      release(); const result = await pending;
      if (scenario === "same-session-success") { assert.deepEqual(result.value, record); assert.deepEqual(client.getQueryData(queryKeys.admin.content.detail("countries", record.id)), record); assert.equal(invalidations, 3); }
      else { assert.equal(client.getQueryData(queryKeys.admin.content.detail("countries", record.id)), undefined); assert.equal(invalidations, 0); assert.ok(result.error); if (scenario !== "same-session-failure") assert.ok(result.error instanceof StaleContentSessionError); }
      assert.equal(calls, 1);
    } finally { apiClient.defaults.adapter = previous; client.clear(); }
  });
}

for (const status of [200, 400, 401, 403]) test(`password hook ${status}: secret-free cache, one request, terminal success only`, async () => {
  const client = new QueryClient(); client.setQueryData(queryKeys.session, actor); client.setQueryData(["admin", "private-fixture"], record);
  let submit!: ReturnType<typeof useChangePasswordMutation>["submit"];
  function Harness() { submit = useChangePasswordMutation().submit; return null; }
  renderToString(<QueryClientProvider client={client}><AdminAccessProvider mockEnabled={false}><Harness /></AdminAccessProvider></QueryClientProvider>);
  const previous = apiClient.defaults.adapter; let calls = 0;
  const input = { currentPassword: "LocalOldPassword1", newPassword: "LocalNewPassword2" };
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let start!: () => void; const began = new Promise<void>(resolve => { start = resolve; });
  apiClient.defaults.adapter = async config => {
    calls++; assert.equal(config.url, "/auth/change-password"); assert.deepEqual(JSON.parse(config.data), input); start(); await gate;
    if (status !== 200) throw new AxiosError("LocalOldPassword1", undefined, config, {}, { config, status, statusText: "Rejected", headers: {}, data: { success: false, error: { code: "VALIDATION_ERROR", message: input.newPassword } } });
    return { config, status, statusText: "OK", headers: {}, data: { success: true, data: {} } };
  };
  try {
    const pending = submit(input).catch(error => error); await began;
    assert.equal(JSON.stringify(client.getMutationCache().getAll().map(item => item.state)).includes(input.currentPassword), false);
    await assert.rejects(submit(input)); release(); await pending;
    const retained = JSON.stringify(client.getMutationCache().getAll().map(item => item.state));
    assert.equal(retained.includes(input.currentPassword) || retained.includes(input.newPassword), false);
    assert.equal(calls, 1);
    if (status === 200) { assert.equal(client.getQueryData(queryKeys.session), null); assert.equal(client.getQueryData(["admin", "private-fixture"]), undefined); }
    else assert.deepEqual(client.getQueryData(queryKeys.session), actor);
  } finally { apiClient.defaults.adapter = previous; client.clear(); }
});
