import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client/client";
import { contentApi, type University } from "@/lib/api-client/content";
import { universitySectionApi } from "@/lib/api-client/university-management";
import { phase4Api } from "@/lib/api-client/phase4";
import { scholarshipUniversityFilters } from "@/lib/content-filters";
import { initialContentValues, toContentPatch, toContentPayload } from "@/lib/content-form";
import { sectionPayload, sectionValues } from "@/lib/university-form";
import { programCreateSchema, programPatchSchema, requirementCreateSchema, requirementPatchSchema } from "@/lib/university-schemas";
import { auditSchema, journeySchema } from "@/lib/phase4-schemas";
import { countryId, dates, majorId, program, recordId, requirement, university, universityId } from "./fixtures/university-management";
import { auditFixture, journeyFixture, summaryFixture } from "./fixtures/phase4";

const current = { id: recordId, amount: "1200.50", currency: "USD", billingPeriod: "YEAR" as const, academicYear: "2026/2027", ...dates };
const other = { ...current, id: majorId, amount: "1450.00", currency: "EUR", billingPeriod: "SEMESTER" as const, academicYear: "2027/2028" };
const pagination = { page: 1, limit: 12, total: 2, totalPages: 1 };

test("program envelope retains nullable current tuition, required complete ordered history and exact amount strings", async () => {
  const original = apiClient.defaults.adapter;
  const items = [{ ...program, tuition: current, tuitionFees: [other, null, current] }, { ...program, id: universityId }];
  apiClient.defaults.adapter = async config => {
    assert.equal(config.url, `/admin/universities/${universityId}/programs`);
    assert.equal(config.withCredentials, true);
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: { items, pagination } } };
  };
  try {
    const result = await universitySectionApi.list("programs", universityId, {});
    assert.deepEqual(result, { items, pagination });
    assert.equal(result.items[0].tuition?.academicYear, "2026/2027");
    assert.deepEqual(result.items[1].tuitionFees, []);
    items[0].tuitionFees = undefined as never;
    await assert.rejects(universitySectionApi.list("programs", universityId, {}), /tuitionFees/);
  } finally { apiClient.defaults.adapter = original; }
});

test("program create and failed yearly PATCH serialize only documented input without copying history or retrying", async () => {
  const original = apiClient.defaults.adapter; const sent: { path?: string; method?: string; data: Record<string, unknown> }[] = [];
  const row = { ...program, tuition: current, tuitionFees: [other, current] };
  const input = { includeTuition: "yes", amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" };
  apiClient.defaults.adapter = async config => {
    sent.push({ path: config.url, method: config.method, data: JSON.parse(config.data) });
    if (config.method === "patch") throw new AxiosError("synthetic conflict", undefined, config, {}, { config, headers: {}, status: 409, statusText: "Conflict", data: { success: false, error: { code: "CONFLICT", message: "synthetic" } } });
    return { config, headers: {}, status: 201, statusText: "Created", data: { success: true, data: row } };
  };
  try {
    const create = programCreateSchema.parse(sectionPayload("programs", { ...sectionValues("programs", row), ...input }));
    const patch = programPatchSchema.parse(sectionPayload("programs", { ...sectionValues("programs", row), ...input }, row));
    assert.deepEqual(await universitySectionApi.save("programs", universityId, create), row);
    await assert.rejects(universitySectionApi.save("programs", universityId, patch, recordId), (error: AxiosError) => error.response?.status === 409);
    assert.deepEqual(sent.map(x => [x.method, x.path]), [["post", `/admin/universities/${universityId}/programs`], ["patch", `/admin/university-programs/${recordId}`]]);
    const yearly = { amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" };
    assert.deepEqual(sent[0].data.tuition, yearly); assert.equal("tuitionFees" in sent[0].data, false);
    assert.deepEqual(sent[1].data, { tuition: yearly }); assert.deepEqual(row.tuitionFees, [other, current]);
  } finally { apiClient.defaults.adapter = original; }
});

test("nullable university type clears explicitly, preserving city, country and logo on unrelated PATCH", () => {
  const row = { ...university, status: "DRAFT", universityType: "PUBLIC", cityId: recordId, logoUrl: "https://example.invalid/logo.png" } satisfies University;
  const values = initialContentValues("universities", row);
  assert.equal(values.universityType, "PUBLIC"); assert.equal(values.cityId, recordId); assert.equal(values.countryId, countryId);
  assert.deepEqual(toContentPatch("universities", { ...values, nameAr: "تعديل" }, row), { nameAr: "تعديل" });
  assert.deepEqual(toContentPatch("universities", { ...values, universityType: "" }, row), { universityType: null });
  assert.deepEqual(toContentPatch("universities", { ...values, logoAltEn: "Local logo" }, row), { logoAltEn: "Local logo" });
  assert.equal(toContentPayload("universities", initialContentValues("universities", { ...row, universityType: null })).universityType, null);
  assert.equal("logoUrl" in toContentPayload("universities", { ...values, logoUrl: "" }), false);
});

test("admission create sends null only for non-level scopes and edit never writes scope targets", () => {
  const base = { ...sectionValues("admission-requirements"), contentAr: "نموذج" };
  const university = sectionPayload("admission-requirements", { ...base, scope: "UNIVERSITY", studyLevel: "PHD", programId: recordId });
  assert.equal("studyLevel" in university && university.studyLevel, null); assert.equal("programId" in university, false);
  const level = sectionPayload("admission-requirements", { ...base, scope: "STUDY_LEVEL", studyLevel: "PHD", programId: recordId });
  assert.equal("studyLevel" in level && level.studyLevel, "PHD"); assert.equal("programId" in level, false);
  const target = sectionPayload("admission-requirements", { ...base, scope: "PROGRAM", programId: recordId });
  assert.equal("studyLevel" in target && target.studyLevel, null); assert.equal("programId" in target && target.programId, recordId);
  assert.equal(requirementCreateSchema.safeParse({ contentAr: "نموذج", scope: "STUDY_LEVEL", studyLevel: null }).success, false);
  assert.throws(() => sectionPayload("admission-requirements", { ...base, scope: "PROGRAM" }));
  assert.deepEqual(sectionPayload("admission-requirements", { ...sectionValues("admission-requirements", requirement), contentEn: "Revised", scope: "PROGRAM", programId: recordId }, requirement), { contentEn: "Revised" });
  assert.equal(requirementPatchSchema.safeParse({ contentAr: "نموذج", studyLevel: null }).success, false);
});

test("journey step fields accept only documented enums or null; new audit resource types do not poison the list", () => {
  const item = journeyFixture.items[0]; const step = item.steps[0];
  assert.equal(journeySchema.safeParse(journeyFixture).success, true);
  for (const change of [{ ctaId: "VIEW_SCHOLARSHIP", engagementType: "SCROLL_90" }, { ctaId: "unknown" }, { engagementType: "unknown" }, { engagementType: undefined }]) {
    const expected = change.ctaId === "VIEW_SCHOLARSHIP";
    assert.equal(journeySchema.safeParse({ ...journeyFixture, items: [{ ...item, steps: [{ ...step, ...change }] }] }).success, expected);
  }
  assert.equal(auditSchema.safeParse({ ...auditFixture, resourceType: "COUNTRY_STUDY_GUIDE_SECTION" }).success, true);
});

test("all eight scholarship university filters still serialize without changing legacy scholarship meanings", async () => {
  const original = apiClient.defaults.adapter;
  const advanced = { universitySearch: "جامعة", universityCountry: "new-country", universityMajor: "computer-science", universityStudyLevel: "BACHELORS", universityLanguage: "ENGLISH", universityCity: "new-city", universityType: "PUBLIC", universityFeatured: "false" };
  const params = { country: "old-country", university: "old-university", studyLevel: "MASTERS", fundingType: "FULL", featured: "true" as const, ...scholarshipUniversityFilters({ ...advanced, tuitionRange: "unsupported" }) };
  apiClient.defaults.adapter = async config => {
    assert.equal(config.url, "/admin/scholarships");
    assert.deepEqual(config.params, { country: "old-country", university: "old-university", studyLevel: "MASTERS", fundingType: "FULL", featured: "true", ...advanced });
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: { items: [], pagination } } };
  };
  try { await contentApi.scholarships.list(params); } finally { apiClient.defaults.adapter = original; }
});

test("Analytics summary returns typed rates on success and surfaces a real HTTP failure without fabricated values", async () => {
  const original = apiClient.defaults.adapter;
  let calls = 0;
  apiClient.defaults.adapter = async config => {
    calls++;
    assert.equal(config.url, "/admin/analytics/summary");
    assert.deepEqual(config.params, { granularity: "day", topLimit: 10 });
    if (calls === 1) return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: summaryFixture } };
    throw new AxiosError("synthetic summary failure", undefined, config, {}, { config, headers: {}, status: 500, statusText: "Server Error", data: { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "synthetic" } } });
  };
  try { assert.equal((await phase4Api.summary({})).conversionRates.clientReportedSessionRate, 6.47); await assert.rejects(phase4Api.summary({}), (error: AxiosError) => error.response?.status === 500); assert.equal(calls, 2); }
  finally { apiClient.defaults.adapter = original; }
});
