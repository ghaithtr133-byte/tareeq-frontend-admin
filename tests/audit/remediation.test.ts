import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";
import type { Article, Scholarship } from "@/api/content";
import { initialContentValues, toContentPatch, toContentPayload, articleScholarshipIdsSchema, validateContentValues } from "@/lib/content-form";
import { scholarshipUniversityFilters } from "@/lib/content-filters";
import { safeAuditMetadata } from "@/lib/phase4-presentation";
import { changePasswordSchema, safePasswordError } from "@/lib/change-password";
import { createMockContentRepository } from "@/api/mock-content-repository";

const first = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
const article = { id: first, slug: "local-article", titleAr: "مقال", summaryAr: "ملخص", bodyAr: [{ type: "paragraph", text: "محتوى" }], scholarshipId: first, scholarshipIds: [first, second], countryId: null, universityId: null, status: "DRAFT" } as Article;

test("article unrelated PATCH omits both links; ordered replacement and explicit clear are exact", () => {
  const values = initialContentValues("articles", article);
  values.summaryAr = "ملخص معدل";
  assert.deepEqual(toContentPatch("articles", values, article), { summaryAr: "ملخص معدل" });
  values.scholarshipIds = [second, first];
  assert.deepEqual(toContentPatch("articles", values, article).scholarshipIds, [second, first]);
  assert.equal("scholarshipId" in toContentPatch("articles", values, article), false);
  values.scholarshipIds = [];
  assert.deepEqual(toContentPatch("articles", values, article).scholarshipIds, []);
});
test("article unique UUID/max50 validation and legacy compatibility", () => {
  assert.equal(articleScholarshipIdsSchema.safeParse([first, first]).success, false);
  assert.equal(articleScholarshipIdsSchema.safeParse(["not-uuid"]).success, false);
  const fifty = Array.from({ length: 50 }, (_, i) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  assert.equal(articleScholarshipIdsSchema.safeParse(fifty).success, true);
  assert.equal(articleScholarshipIdsSchema.safeParse([...fifty, second]).success, false);
  assert.equal(toContentPayload("articles", { scholarshipId: first }).scholarshipId, first);
  assert.deepEqual(initialContentValues("articles", { ...article, scholarshipIds: undefined }).scholarshipIds, [first]);
  assert.deepEqual(toContentPayload("articles", { scholarshipIds: [second], scholarshipId: first }).scholarshipIds, [second]);
  assert.equal("scholarshipId" in toContentPayload("articles", { scholarshipIds: [second], scholarshipId: first }), false);
});
test("deadline UTC/Amman/DST-zone roundtrip preserves seconds and milliseconds, changed and null PATCH", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["UTC", "Asia/Amman", "America/New_York"]) {
      process.env.TZ = zone;
      for (const deadline of ["2026-11-20T12:34:56.123Z", "2026-07-20T12:34:56.123Z"]) {
        const row = { verifiedDeadline: deadline, titleAr: "منحة" } as Scholarship;
        const values = initialContentValues("scholarships", row);
        assert.equal(toContentPayload("scholarships", values).verifiedDeadline, deadline);
        values.titleAr = "تغيير";
        assert.deepEqual(toContentPatch("scholarships", values, row), { titleAr: "تغيير" });
        values.verifiedDeadline = "2026-12-01T15:30:45.123";
        assert.equal(toContentPatch("scholarships", values, row).verifiedDeadline, new Date(String(values.verifiedDeadline)).toISOString());
        values.verifiedDeadline = "";
        assert.equal(toContentPatch("scholarships", values, row).verifiedDeadline, null);
      }
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test("no-op PATCH rejected and explicit nullable relationships preserved", () => {
  const values = initialContentValues("articles", article);
  assert.throws(() => toContentPatch("articles", values, article), /لا توجد تغييرات/);
  const row = { ...article, universityId: second };
  assert.equal(toContentPatch("articles", { ...initialContentValues("articles", row), universityId: "" }, row).universityId, null);
});
test("four core slug editors enforce exact min/max/pattern without rewriting valid slugs", () => {
  for (const kind of ["countries", "scholarships", "services", "articles"] as const) {
    for (const slug of ["x", "a".repeat(121), "UPPER", "bad--slug"]) assert.ok(validateContentValues(kind, { slug }).slug);
    for (const slug of ["aa", "a-b", "a".repeat(120)]) assert.equal(validateContentValues(kind, { slug }).slug, undefined);
  }
});
test("all eight university filters preserve exact values, ignore invalid values and unrelated input", () => {
  const input = { universitySearch: "جامعة", universityCountry: "country-aa", universityMajor: "computer-science", universityStudyLevel: "BACHELORS", universityLanguage: "ENGLISH", universityCity: "city-aa", universityType: "PUBLIC", universityFeatured: "false" };
  assert.deepEqual(scholarshipUniversityFilters({ ...input, token: "ignored" }), input);
  for (const key of Object.keys(input)) assert.deepEqual(scholarshipUniversityFilters({ [key]: "INVALID VALUE" }), key === "universitySearch" ? { universitySearch: "INVALID VALUE" } : {});
  assert.deepEqual(scholarshipUniversityFilters({ universitySearch: "x".repeat(201), universityCity: ["aa"], universityFeatured: "" }), {});
});
test("safe metadata allows documented transitions only and never projects sensitive values", () => {
  for (const value of ["NEW", "IN_REVIEW", "RESOLVED", "CLOSED", "DRAFT", "PUBLISHED", "ARCHIVED", "ADMIN", "SUPER_ADMIN"]) assert.ok(safeAuditMetadata({ toStatus: value }).rows.length, value);
  assert.equal(safeAuditMetadata({ toStatus: "CONTACTED", password: "SECRET", token: "SECRET", message: "SECRET" }).rows.length, 0);
  assert.equal(JSON.stringify(safeAuditMetadata({ toStatus: { secret: "SECRET" }, cookies: "SECRET" })).includes("SECRET"), false);
});
test("password exact schema and error projection never retain Backend message/cause/config", () => {
  assert.equal(changePasswordSchema.safeParse({ currentPassword: "local", newPassword: "LongPassword123" }).success, true);
  for (const value of ["shortA1", "lowercase12345", "UPPERCASE12345", "NoDigitsPresent"]) assert.equal(changePasswordSchema.safeParse({ currentPassword: "local", newPassword: value }).success, false);
  const error = new AxiosError("SECRET", undefined, { data: "SECRET" } as never, {}, { status: 400, data: { success: false, error: { message: "SECRET", details: { fields: { newPassword: ["SECRET"], token: ["SECRET"] } } } } } as never);
  const safe = safePasswordError(error);
  assert.equal(safe.status, 400); assert.deepEqual(safe.fields, ["newPassword"]);
  assert.equal(JSON.stringify(safe).includes("SECRET"), false); assert.equal(safe.cause, undefined);
});
test("development repository preserves ordered associations, omission, explicit clear and legacy replacement", async () => {
  const repo = createMockContentRepository().getApi("articles");
  const row = (await repo.list({})).items[0];
  assert.deepEqual((await repo.update(row.id, { scholarshipIds: [first, second] })).scholarshipIds, [first, second]);
  assert.deepEqual((await repo.update(row.id, { summaryAr: "فقط" })).scholarshipIds, [first, second]);
  assert.deepEqual((await repo.update(row.id, { scholarshipIds: [] })).scholarshipIds, []);
  const legacy = await repo.update(row.id, { scholarshipId: second });
  assert.deepEqual(legacy.scholarshipIds, [second]); assert.equal(legacy.scholarshipId, second);
});
