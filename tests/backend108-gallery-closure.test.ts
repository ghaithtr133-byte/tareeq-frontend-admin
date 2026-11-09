import assert from "node:assert/strict";
import test from "node:test";
import { apiClient } from "@/lib/api-client/client";
import { phase4Api } from "@/lib/api-client/phase4";
import { loadGalleryOrder, universitySectionApi, type GalleryImage } from "@/lib/api-client/university-management";
import { activeGalleryOrder, galleryRows } from "./fixtures/gallery-closure";
import { universityId } from "./fixtures/university-management";

const galleryPath = `/admin/universities/${universityId}/gallery`;
function isolate(rows: GalleryImage[], malformed?: "duplicate" | "incomplete") {
  const previous = apiClient.defaults.adapter;
  const pages: number[] = []; const writes: string[][] = [];
  apiClient.defaults.adapter = async config => {
    assert.equal(config.withCredentials, true);
    let data: unknown;
    if (config.method === "get") {
      assert.equal(config.url, galleryPath); assert.equal(config.params.limit, 100); assert.equal(config.params.status, undefined);
      const page = Number(config.params.page); pages.push(page);
      let items = rows.slice((page - 1) * 100, page * 100);
      if (page === 2 && malformed === "duplicate") items = [rows[0], ...items.slice(1)];
      if (page === 2 && malformed === "incomplete") items = items.slice(1);
      data = { items, pagination: { page, limit: 100, total: rows.length, totalPages: Math.ceil(rows.length / 100) } };
    } else {
      assert.equal(config.method, "patch"); assert.equal(config.url, `${galleryPath}/order`);
      const body = JSON.parse(config.data); const ids: string[] = body.orderedIds; writes.push(ids);
      assert.deepEqual(Object.keys(body), ["orderedIds"]);
      assert.deepEqual([...ids].sort(), activeGalleryOrder(rows).sort());
      data = { items: ids.map((id, displayOrder) => ({ ...rows.find(row => row.id === id), displayOrder })) };
    }
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data } };
  };
  return { pages, writes, restore: () => { apiClient.defaults.adapter = previous; } };
}

for (const count of [6, 100]) test(`gallery ${count} active: complete, sorted set; exact outgoing order`, async () => {
  const rows = galleryRows(count); const stub = isolate(rows);
  try {
    const loaded = await loadGalleryOrder(universityId);
    assert.deepEqual(loaded.map(item => item.id), activeGalleryOrder(rows));
    assert.deepEqual(stub.pages, [1]);
    const changed = loaded.map(item => item.id).reverse();
    const result = await universitySectionApi.reorder(universityId, changed);
    assert.deepEqual(stub.writes, [changed]); assert.deepEqual(result.items.map(item => item.id), changed);
  } finally { stub.restore(); }
});

test("gallery 101 active: loader guard and request schema reject; no PATCH or truncation", async () => {
  const rows = galleryRows(101, 4); const stub = isolate(rows);
  try {
    await assert.rejects(loadGalleryOrder(universityId), /100 صورة غير مؤرشفة/);
    assert.deepEqual(stub.pages, [1, 2]);
    await assert.rejects(universitySectionApi.reorder(universityId, activeGalleryOrder(rows)), /orderedIds/);
    assert.deepEqual(stub.writes, []);
  } finally { stub.restore(); }
});

test("gallery mixed statuses: include both draft and published across pages, exclude archived", async () => {
  const rows = galleryRows(4, 98); const stub = isolate(rows);
  try {
    const loaded = await loadGalleryOrder(universityId);
    assert.deepEqual(stub.pages, [1, 2]);
    assert.deepEqual(loaded.map(item => item.id), activeGalleryOrder(rows));
    assert.deepEqual(new Set(loaded.map(item => item.status)), new Set(["DRAFT", "PUBLISHED"]));
    const changed = loaded.map(item => item.id).reverse();
    await universitySectionApi.reorder(universityId, changed);
    assert.deepEqual(stub.writes, [changed]);
  } finally { stub.restore(); }
});

test("gallery incomplete or duplicate paginated result is rejected before writing", async () => {
  for (const malformed of ["duplicate", "incomplete"] as const) {
    const stub = isolate(galleryRows(4, 98), malformed);
    try { await assert.rejects(loadGalleryOrder(universityId), /قائمة ترتيب غير مكتملة/); assert.deepEqual(stub.pages, [1, 2]); assert.deepEqual(stub.writes, []); }
    finally { stub.restore(); }
  }
});

test("Analytics Summary accepts a documented empty period without manufacturing records", async () => {
  const previous = apiClient.defaults.adapter;
  const submissions = { applications: 0, inquiries: 0, total: 0 };
  const data = { range: { from: "2026-11-05", to: "2026-11-05", granularity: "day" }, totals: { pageViews: 0, visitors: 0, sessions: 0 }, topPages: [], trafficSources: [], ctaEngagement: [], clientReportedConversions: submissions, serverVerifiedConversions: submissions, conversionRates: { clientReportedSessionRate: 0, applicationSessionRate: 0, inquirySessionRate: 0 }, funnel: [], trends: [] };
  apiClient.defaults.adapter = async config => {
    assert.equal(config.method, "get"); assert.equal(config.url, "/admin/analytics/summary"); assert.equal(config.withCredentials, true);
    assert.deepEqual(config.params, { granularity: "day", topLimit: 10 });
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data } };
  };
  try { assert.deepEqual(await phase4Api.summary({ granularity: "day", topLimit: 10 }), data); }
  finally { apiClient.defaults.adapter = previous; }
});
