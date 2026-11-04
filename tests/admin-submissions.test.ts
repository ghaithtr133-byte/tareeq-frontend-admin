import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { getApiFieldErrors, normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import { generalInquirySchema, serializeSubmissionParams, studentApplicationSchema, submissionApi, submissionStatusUpdateSchema } from "@/api/submissions";
import { cacheSubmissionUpdate } from "@/hook/mutations/use-submission-mutation";
import { parseSubmissionFilters, submissionChanges, submissionErrorMessage } from "@/lib/submissions";
import { applicationFixture, inquiryFixture } from "./fixtures/submissions";
import { clearPrivateAdminCache } from "@/lib/admin-session-cache";

test("six submission endpoints map exact methods, filters, envelopes, JSON and credentials", async () => {
  const original = apiClient.defaults.adapter;
  const calls: Array<{ method?: string; url?: string; params: unknown; data: unknown }> = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, params: config.params, data: config.data });
    assert.equal(config.withCredentials, true);
    const record = config.url?.includes("applications") ? applicationFixture : inquiryFixture;
    const isList = config.url === "/admin/applications" || config.url === "/admin/inquiries";
    if (config.method === "patch") assert.equal(config.headers.get("Content-Type"), "application/json");
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: isList ? { items: [record], pagination: { page: 2, limit: 12, total: 13, totalPages: 2 } } : record } };
  };
  try {
    for (const resource of ["applications", "inquiries"] as const) {
      const list = await submissionApi.list(resource, { page: 2, limit: 12, status: "NEW", sort: "updated", applicationType: "SCHOLARSHIP_ASSISTANCE" } as never);
      assert.equal(list.pagination.totalPages, 2);
      assert.deepEqual(await submissionApi.get(resource, applicationFixture.id), list.items[0]);
      await submissionApi.update(resource, applicationFixture.id, { internalNote: null });
    }
  } finally { apiClient.defaults.adapter = original; }
  assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), ["applications", "inquiries"].flatMap((r) => [`get /admin/${r}`, `get /admin/${r}/${applicationFixture.id}`, `patch /admin/${r}/${applicationFixture.id}/status`]));
  assert.deepEqual(calls[0].params, { page: 2, limit: 12, status: "NEW", sort: "updated", applicationType: "SCHOLARSHIP_ASSISTANCE" });
  assert.deepEqual(calls[3].params, { page: 2, limit: 12, status: "NEW", sort: "updated" });
  assert.equal(calls[2].data, '{"internalNote":null}');
});

test("filter defaults, allowlists, limits, and nullable response fields follow the schemas", () => {
  assert.deepEqual(serializeSubmissionParams("inquiries", { search: "unsupported" } as never), { page: 1, limit: 12, sort: "newest" });
  assert.throws(() => serializeSubmissionParams("applications", { limit: 51 }));
  assert.throws(() => serializeSubmissionParams("inquiries", { page: 0 }));
  assert.deepEqual(parseSubmissionFilters("inquiries", { page: "-1", limit: "100", sort: "bad", applicationType: "UNIVERSITY_ADMISSION" }), { page: 1, limit: 12, sort: "newest", status: undefined });
  assert.equal(studentApplicationSchema.safeParse({ ...applicationFixture, scholarshipId: null, universityId: null, countryId: null, studyLevel: null, intendedMajor: null }).success, true);
  assert.equal(generalInquirySchema.parse(inquiryFixture).phone, null);
  assert.equal(studentApplicationSchema.safeParse({ ...applicationFixture, status: "DRAFT" }).success, false);
});

test("partial workflow patches distinguish omitted, empty, cleared, and unchanged notes", () => {
  for (const input of [{ status: "CLOSED" }, { internalNote: null }, { internalNote: "" }, { internalNote: "x".repeat(5000) }]) assert.equal(submissionStatusUpdateSchema.safeParse(input).success, true);
  for (const input of [{}, { internalNote: "x".repeat(5001) }, { status: "DRAFT" }, { internalNote: "x", reply: true }]) assert.equal(submissionStatusUpdateSchema.safeParse(input).success, false);
  assert.deepEqual(submissionChanges(applicationFixture, "NEW", null), {});
  assert.deepEqual(submissionChanges(applicationFixture, "NEW", ""), { internalNote: "" });
  assert.deepEqual(submissionChanges({ status: "NEW", internalNote: "note" }, "RESOLVED", null), { status: "RESOLVED", internalNote: null });
});

test("invalid IDs and patches never reach the transport", async () => {
  const original = apiClient.defaults.adapter;
  let calls = 0;
  apiClient.defaults.adapter = async () => { calls++; throw new Error("unexpected transport"); };
  try {
    await assert.rejects(submissionApi.get("applications", "invalid"));
    await assert.rejects(submissionApi.update("inquiries", inquiryFixture.id, {}));
    assert.equal(calls, 0);
  } finally { apiClient.defaults.adapter = original; }
});

test("mutation cache refresh targets this resource and cannot repopulate after logout", async () => {
  const client = new QueryClient();
  const id = "admin-test";
  const listKey = queryKeys.admin.submissions.list("applications", {});
  const otherKey = queryKeys.admin.submissions.list("inquiries", {});
  client.setQueryData(queryKeys.session, { id });
  client.setQueryData(listKey, { items: [] });
  client.setQueryData(otherKey, { items: [] });
  await cacheSubmissionUpdate(client, "applications", applicationFixture, id);
  assert.deepEqual(client.getQueryData(queryKeys.admin.submissions.detail("applications", applicationFixture.id)), applicationFixture);
  assert.equal(client.getQueryState(listKey)?.isInvalidated, true);
  assert.equal(client.getQueryState(otherKey)?.isInvalidated, false);
  await assert.rejects(client.fetchQuery({ queryKey: queryKeys.session, queryFn: async () => { throw new Error("Session expired"); }, retry: false }));
  clearPrivateAdminCache(client);
  await cacheSubmissionUpdate(client, "applications", applicationFixture, id);
  assert.equal(client.getQueryData(queryKeys.admin.submissions.detail("applications", applicationFixture.id)), undefined);
  client.clear();
  await cacheSubmissionUpdate(client, "applications", applicationFixture, id);
  assert.equal(client.getQueryCache().getAll().length, 0);
});

test("documented submission errors, field validation, network and cancellation remain distinguishable", async () => {
  const original = apiClient.defaults.adapter;
  try {
    for (const status of [400, 401, 403, 404, 415, 500]) {
      const cause = new AxiosError("Request failed", undefined, undefined, undefined, { config: { headers: {} } as never, status, statusText: "Error", headers: {}, data: { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid fields", details: { fields: { internalNote: ["Too long"] } } } } });
      let calls = 0;
      apiClient.defaults.adapter = async () => { calls++; throw cause; };
      await assert.rejects(submissionApi.update("applications", applicationFixture.id, { status: "IN_REVIEW" }), (error) => error === cause);
      assert.equal(calls, 1);
      assert.equal(normalizeApiError(cause).status, status);
      assert.deepEqual(getApiFieldErrors(cause), { internalNote: ["Too long"] });
      assert.ok(submissionErrorMessage(cause).length);
    }
    assert.equal(normalizeApiError(new CanceledError()).kind, "cancelled");
    const network = new AxiosError("Network Error", "ERR_NETWORK", undefined, {});
    assert.equal(normalizeApiError(network).kind, "network");
    const controller = new AbortController(); controller.abort();
    await assert.rejects(submissionApi.get("inquiries", inquiryFixture.id, { signal: controller.signal }), (error) => normalizeApiError(error).kind === "cancelled");
  } finally { apiClient.defaults.adapter = original; }
});

test("terminal-session cleanup removes private data while preserving the session result", async () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.session, null);
  client.setQueryData(queryKeys.admin.submissions.detail("applications", applicationFixture.id), applicationFixture);
  client.getMutationCache().build(client, { mutationFn: async () => applicationFixture });
  clearPrivateAdminCache(client);
  assert.equal(client.getQueryData(queryKeys.session), null);
  assert.equal(client.getQueryCache().getAll().length, 1);
  assert.equal(client.getMutationCache().getAll().length, 0);
  client.clear();
});
