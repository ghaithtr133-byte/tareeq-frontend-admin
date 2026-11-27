import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  contentHardDeleteApi,
  type DeletionImpact,
} from "@/lib/api-client/content";
import { apiClient } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/api-client/query-keys";
import { invalidateContentAfterHardDelete } from "@/hook/mutations/use-content-hard-delete-mutation";
import { getAllowedDevApiEndpoint } from "@/lib/admin-dev-api-proxy";

const id = "00000000-0000-4000-8000-000000000042";
const impact: DeletionImpact = {
  target: { resource: "countries", id, slug: "country", status: "PUBLISHED" },
  outcome: "SAFE",
  items: [],
};

test("TA-42: country, university, and scholarship delete calls use only documented endpoints with cookies", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const calls: Array<{ method?: string; url?: string; withCredentials?: boolean }> = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, withCredentials: config.withCredentials });
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: { id, impact } } };
  };
  try {
    for (const resource of ["countries", "universities", "scholarships"] as const) {
      await contentHardDeleteApi.request(resource, id);
      await contentHardDeleteApi.confirm(resource, id, id);
    }
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
  assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), [
    `delete /admin/countries/${id}`, `post /admin/countries/${id}/hard-delete/confirm`,
    `delete /admin/universities/${id}`, `post /admin/universities/${id}/hard-delete/confirm`,
    `delete /admin/scholarships/${id}`, `post /admin/scholarships/${id}/hard-delete/confirm`,
  ]);
  assert.ok(calls.every((call) => call.withCredentials));
});

test("TA-42: cache invalidation is limited to the target, impacted relationships, and selectors", async () => {
  const removed: unknown[] = [];
  const invalidated: unknown[] = [];
  await invalidateContentAfterHardDelete({
    removeQueries: (filters: { queryKey?: unknown }) => { removed.push(filters.queryKey); },
    invalidateQueries: async (filters: { queryKey?: unknown }) => { invalidated.push(filters.queryKey); },
  } as never, "countries", id, {
    ...impact,
    items: [{ resourceType: "UNIVERSITY", effect: "UNLINK", count: 1, relationshipPath: "country.universities", sampleIds: [], code: "UNLINK", canConfirm: false, blocked: false }],
  });
  assert.deepEqual(removed, [queryKeys.admin.content.detail("countries", id)]);
  assert.deepEqual(invalidated, [
    queryKeys.admin.content.resourceLists("countries"),
    queryKeys.admin.content.resourceLists("universities"),
    queryKeys.admin.content.selectors(),
  ]);
});

test("TA-42: the proxy permits the three documented workflows but keeps Services delete suspended", () => {
  for (const resource of ["countries", "universities", "scholarships"]) {
    assert.deepEqual(getAllowedDevApiEndpoint(["admin", resource, id]), { path: `/admin/${resource}/${id}`, methods: ["GET", "PATCH", "DELETE", "OPTIONS"] });
    assert.deepEqual(getAllowedDevApiEndpoint(["admin", resource, id, "hard-delete", "confirm"]), { path: `/admin/${resource}/${id}/hard-delete/confirm`, methods: ["POST", "OPTIONS"] });
  }
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "services", id]), { path: `/admin/services/${id}`, methods: ["GET", "PATCH", "OPTIONS"] });
});

test("TA-42: responsive list and edit entry points use the shared dialog for both roles without publication gating", () => {
  const dialog = readFileSync("components/content/content-hard-delete-dialog.tsx", "utf8");
  const countryList = readFileSync("components/content/countries-list-page.tsx", "utf8");
  const universityList = readFileSync("components/content/universities-list-page.tsx", "utf8");
  const scholarshipList = readFileSync("components/content/scholarships-list-page.tsx", "utf8");
  const countryForm = readFileSync("components/content/country-form-page.tsx", "utf8");
  const scholarshipForm = readFileSync("components/content/scholarship-form-page.tsx", "utf8");
  const genericForm = readFileSync("components/content/content-form-page.tsx", "utf8");
  for (const source of [countryList, universityList, scholarshipList, countryForm, scholarshipForm, genericForm]) {
    assert.match(source, /ContentHardDeleteDialog/);
    assert.match(source, /access\.user\?\.role === "ADMIN" \|\| access\.user\?\.role === "SUPER_ADMIN"/);
  }
  assert.match(dialog, /DEMO_FIXTURE_PROTECTED/);
  assert.match(dialog, /item\.effect === "DELETE"/);
  assert.doesNotMatch(dialog.slice(dialog.indexOf("<ul")), /relationshipPath/);
  assert.doesNotMatch(dialog, /status === "PUBLISHED"/);
});
