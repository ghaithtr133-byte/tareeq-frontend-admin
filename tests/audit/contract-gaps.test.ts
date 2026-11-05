import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialContentValues, toContentPayload, validateContentValues } from "@/lib/content-form";
import { contentDefinitions } from "@/lib/content-config";
import type { Article, Scholarship } from "@/api/content";
import { safeAuditMetadata } from "@/lib/phase4-presentation";

// Audit acceptance assertions deliberately remain RED when a defect exists.
// No network transport, real credentials, or production record is used.
const spec = JSON.parse(readFileSync(process.env.ADMIN_AUDIT_SPEC ?? "C:/Users/CMerna/Downloads/tareeq-academy-api.json", "utf8"));
const id = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
const article = { id, titleAr: "مقال محلي", summaryAr: "ملخص محلي", slug: "local-article", featured: false, status: "DRAFT", bodyAr: [{ type: "paragraph", text: "نص محلي" }], bodyEn: null, countryId: null, universityId: null, scholarshipId: id, scholarshipIds: [id, second], relatedScholarships: [] } as unknown as Article;

test("AUD-01: Article initialization and an unrelated edit preserve ordered scholarshipIds", () => {
  assert.ok(spec.components.schemas.ArticlePatchRequest.properties.scholarshipIds);
  const values = initialContentValues("articles", article);
  values.summaryAr = "ملخص معدل فقط";
  const patch = toContentPayload("articles", values) as Record<string, unknown>;
  // Omit BOTH association fields to preserve, or submit the complete ordered set.
  assert.ok(!("scholarshipId" in patch) || JSON.stringify(patch.scholarshipIds) === JSON.stringify([id, second]), "Legacy scholarshipId-only PATCH replaces a multi-link association with one link.");
});

test("AUD-02: Scholarship deadline initialization/save round-trips in Asia/Amman", () => {
  assert.equal(process.env.TZ, "Asia/Amman");
  const deadline = "2026-11-20T12:34:56.000Z";
  const values = initialContentValues("scholarships", { verifiedDeadline: deadline } as Scholarship);
  const payload = toContentPayload("scholarships", values);
  assert.equal(payload.verifiedDeadline, deadline);
});

test("AUD-03: Every original content editor rejects a one-character slug", () => {
  for (const resource of ["countries", "scholarships", "services", "articles"] as const) {
    assert.equal(spec.components.schemas[({ countries: "Country", scholarships: "Scholarship", services: "Service", articles: "Article" } as const)[resource] + "CreateRequest"].properties.slug.minLength, 2);
    assert.ok(validateContentValues(resource, { ...initialContentValues(resource), slug: "x" }).slug, resource);
  }
});

test("AUD-04: Scholarship associated-University filters are represented in frontend config", () => {
  const names = spec.paths["/api/v1/admin/scholarships"].get.parameters.filter((p: { in: string }) => p.in === "query").map((p: { name: string }) => p.name);
  const omitted = names.filter((name: string) => !["page", "limit", ...contentDefinitions.scholarships.filters].includes(name));
  assert.deepEqual(omitted, [], "API type and URL parser also omit these parameters; this is not merely absent UI controls.");
});

test("AUD-05: Current-password change has a frontend API consumer, not just a proxy allowlist", () => {
  assert.ok(spec.paths["/api/v1/auth/change-password"].post);
  assert.ok(/["']\/auth\/change-password["']/.test(readFileSync("api/auth.ts", "utf8")), "No change-password API consumer exists.");
});

test("AUD-09: Safe audit metadata includes the documented RESOLVED submission status", () => {
  assert.ok(spec.components.schemas.SubmissionStatus.enum.includes("RESOLVED"));
  assert.deepEqual(safeAuditMetadata({ toStatus: "RESOLVED" }).rows, [{ label: "الحالة الجديدة", value: "RESOLVED" }]);
});

test("AUD-PASS: Supported original content fields still map flat blocks and explicit null relationships", () => {
  const payload = toContentPayload("articles", initialContentValues("articles", article));
  assert.deepEqual(payload.bodyAr, article.bodyAr);
  assert.equal(payload.bodyEn, null);
  assert.equal(payload.countryId, null);
  assert.equal(payload.universityId, null);
  assert.equal(contentDefinitions.scholarships.fields.some(field => field.name === "applicationStatus"), true);
  assert.equal(contentDefinitions.scholarships.fields.some(field => field.name === "status"), true);
});
