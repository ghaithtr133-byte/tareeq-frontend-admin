import assert from "node:assert/strict";
import test from "node:test";
import type { InternalAxiosRequestConfig } from "axios";

import { apiClient } from "@/lib/api-client/client";
import { contentDetailApi } from "@/lib/api-client/content-details";
import { detailCreatePayload, detailOrderSchema, detailPatchPayload, detailPatchSchema, detailSectionsFor, detailValues } from "@/lib/content-detail-schemas";
import { getAllowedDevApiEndpoint } from "@/lib/admin-dev-api-proxy";
import { parentSaveDestination } from "@/lib/content-form";

const parentId = "10000000-0000-4000-8000-000000000001";
const firstId = "20000000-0000-4000-8000-000000000001";
const secondId = "20000000-0000-4000-8000-000000000002";
const entry = { id: firstId, kind: "STEP" as const, titleAr: "خطوة أولى", descriptionAr: null, displayOrder: 1 };
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({ config, status, statusText: "OK", headers: {}, data: { success: true, data } });

test("content detail APIs construct the six documented resource paths and methods", async () => {
  const original = apiClient.defaults.adapter; const calls: Array<{ method?: string; url?: string; data?: unknown; params?: unknown; withCredentials?: boolean }> = [];
  apiClient.defaults.adapter = async config => {
    calls.push({ method: config.method, url: config.url, data: config.data ? JSON.parse(String(config.data)) : undefined, params: config.params, withCredentials: config.withCredentials });
    if (config.method === "get") return response(config, { items: [entry] });
    if (config.method === "post") return response(config, { id: firstId }, 201);
    if (config.method === "delete") return response(config, { id: firstId });
    if (config.url?.endsWith("/order")) return response(config, { items: [] });
    return response(config, { id: firstId });
  };
  try {
    for (const [resource, collection, item] of [["countries", "study-guide", "study-guide"], ["services", "service-detail-items", "service-detail-items"], ["scholarships", "scholarship-detail-items", "scholarship-detail-items"]] as const) {
      const listed = await contentDetailApi.list(resource, parentId, "STEP"); assert.equal(listed[0]?.id, firstId);
      await contentDetailApi.create(resource, parentId, { kind: "STEP", titleAr: "جديد" });
      await contentDetailApi.update(resource, parentId, firstId, { titleAr: "محدّث" });
      await contentDetailApi.remove(resource, parentId, firstId);
      await contentDetailApi.reorder(resource, parentId, "STEP", [secondId, firstId]);
      const base = `/admin/${resource}/${parentId}/${collection}`;
      const itemPath = `/admin/${item}/${firstId}`;
      assert.deepEqual(getAllowedDevApiEndpoint(["admin", resource, parentId, collection]), { path: base, methods: ["GET", "POST", "OPTIONS"] });
      assert.deepEqual(getAllowedDevApiEndpoint(["admin", resource, parentId, collection, "order"]), { path: `${base}/order`, methods: ["PATCH", "OPTIONS"] });
      assert.deepEqual(getAllowedDevApiEndpoint(["admin", item, firstId]), { path: itemPath, methods: ["PATCH", "DELETE", "OPTIONS"] });
      assert.deepEqual(calls.splice(0), [
        { method: "get", url: base, params: { kind: "STEP" }, data: undefined, withCredentials: true },
        { method: "post", url: base, data: { kind: "STEP", titleAr: "جديد" }, params: undefined, withCredentials: true },
        { method: "patch", url: itemPath, data: { titleAr: "محدّث" }, params: undefined, withCredentials: true },
        { method: "delete", url: itemPath, data: undefined, params: undefined, withCredentials: true },
        { method: "patch", url: `${base}/order`, data: { kind: "STEP", orderedIds: [secondId, firstId] }, params: undefined, withCredentials: true },
      ]);
    }
  } finally { apiClient.defaults.adapter = original; }
});

test("detail payloads keep kind immutable, preserve omissions and require deliberate null", () => {
  const baseline = { ...entry, bodyAr: "نص محفوظ", amount: "1000.00", currency: "USD", verifiedAt: "2026-11-07T10:00:00.000Z" };
  const values = detailValues(baseline);
  assert.deepEqual(detailPatchPayload({ ...values, bodyAr: null }, baseline), { bodyAr: null });
  assert.deepEqual(detailPatchPayload({ ...values, titleAr: "عنوان محدّث" }, baseline), { titleAr: "عنوان محدّث" });
  assert.deepEqual(detailCreatePayload({ kind: "BENEFIT", titleAr: "فائدة", bodyAr: "" }), { kind: "BENEFIT", titleAr: "فائدة" });
  assert.equal(detailPatchSchema.safeParse({ kind: "BENEFIT" }).success, false);
  assert.equal(detailOrderSchema.safeParse({ kind: "STEP", orderedIds: Array.from({ length: 501 }, (_, index) => `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`) }).success, false);
});

test("resource-specific sections hide backend enum names and parent creation advances only after a parent id exists", () => {
  assert.deepEqual(detailSectionsFor("scholarships").map(section => [section.kind, section.label]), [["BENEFIT", "مزايا المنحة"], ["REQUIREMENT", "متطلبات المنحة"], ["APPLICATION_STEP", "خطوات التقديم"]]);
  assert.deepEqual(detailSectionsFor("services").map(section => section.label), ["خطوات الخدمة", "مزايا الخدمة"]);
  assert.deepEqual(detailSectionsFor("countries").map(section => section.kind), ["STEP", "REQUIREMENT", "BENEFIT", "APPLICATION_STEP"]);
  assert.equal(parentSaveDestination("countries", parentId, "finish"), "/admin/countries");
  assert.equal(parentSaveDestination("countries", parentId, "details"), `/admin/countries/${parentId}#content-details`);
  assert.equal(parentSaveDestination("services", parentId, "details", true), "/admin/services");
  assert.equal(parentSaveDestination("articles", parentId, "details"), "/admin/articles");
});
