import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { contentApi } from "@/api/content";
import { directoryApi, loadGalleryOrder, managementParams, universitySectionApi } from "@/api/university-management";
import { uploadImage, validateImageFile } from "@/api/images";
import { normalizeApiError, getApiFieldErrors } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import { invalidateUniversitySection } from "@/hook/mutations/use-university-management";
import { galleryOrderSchema, programCreateSchema, requirementCreateSchema, requirementPatchSchema, tuitionInputSchema } from "@/lib/university-schemas";
import { sectionPayload, sectionValues } from "@/lib/university-form";
import { initialContentValues, toContentPayload, validateContentValues } from "@/lib/content-form";
import { getAllowedDevApiEndpoint, validateTrustedDevelopmentRequest } from "@/lib/admin-dev-api-proxy";
import { countryId, dates, image, major, majorId, program, recordId, requirement, university, universityId, city } from "./fixtures/university-management";

test("all twenty Phase 2 operations preserve exact paths, methods, envelopes and credentials", async () => {
  const old = apiClient.defaults.adapter; const calls: { method?: string; url?: string; data: unknown; params: unknown }[] = [];
  apiClient.defaults.adapter = async config => {
    assert.equal(config.withCredentials, true); calls.push({ method: config.method, url: config.url, data: config.data, params: config.params });
    const url = config.url!; const row = url.includes("academic-majors") ? major : url.includes("cities") ? city : url.includes("admission-requirements") ? requirement : url.includes("gallery") ? image : url.includes("programs") ? program : university;
    const data = config.method === "delete" ? { id: recordId } : url.endsWith("/order") ? { items: [image] } : config.method === "get" && !url.endsWith(universityId) ? { items: [row], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } } : row;
    return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data } };
  };
  try {
    await contentApi.universities.list({ major: "computer-science", city: "amman", studyLevel: "BACHELORS", language: "ENGLISH", universityType: "PUBLIC", status: "DRAFT" }); await contentApi.universities.get(universityId); await contentApi.universities.create({ nameAr: "جامعة", cityId: recordId, universityType: "PUBLIC" }); await contentApi.universities.update(universityId, { cityId: null });
    for (const kind of ["academic-majors", "cities"] as const) { await directoryApi.list(kind, { page: 1, limit: 50, search: "علوم", countryId }); await directoryApi.create(kind, kind === "cities" ? { countryId, slug: "amman", nameAr: "عمّان", nameEn: "Amman" } : { slug: "cs", nameAr: "حاسوب", nameEn: "CS" }); }
    for (const section of ["programs", "admission-requirements", "gallery"] as const) { await universitySectionApi.list(section, universityId, { status: "DRAFT" }); await universitySectionApi.save(section, universityId, section === "programs" ? { academicMajorId: majorId, nameAr: "برنامج", studyLevel: "BACHELORS", languages: ["ENGLISH"], officialSourceUrl: "https://example.invalid", verifiedAt: dates.createdAt } : section === "gallery" ? { imageUrl: image.imageUrl } : { scope: "UNIVERSITY", contentAr: "قبول" }); await universitySectionApi.save(section, universityId, { status: "ARCHIVED" }, recordId); }
    await universitySectionApi.detach(recordId); await universitySectionApi.reorder(universityId, [recordId]);
    assert.equal(calls.length, 19); // Twentieth is multipart upload, verified separately below.
    for (const call of calls) { const endpoint = getAllowedDevApiEndpoint(call.url!.split("/").filter(Boolean)); assert.ok(endpoint?.methods.includes(call.method!.toUpperCase()), `${call.method} ${call.url}`); }
    assert.deepEqual(calls[0].params, { major: "computer-science", city: "amman", studyLevel: "BACHELORS", language: "ENGLISH", universityType: "PUBLIC", status: "DRAFT" });
    assert.equal(calls[3].data, '{"cityId":null}');
  } finally { apiClient.defaults.adapter = old; }
});
test("pagination defaults, caps and supported filters only", () => {
  assert.deepEqual(managementParams("academic-majors", { status: "DRAFT" }), { page: 1, limit: 12 });
  assert.deepEqual(managementParams("gallery", {}), { page: 1, limit: 50 });
  assert.deepEqual(managementParams("programs", { search: " cs ", studyLevel: "PHD", language: "ARABIC", faculty: "علوم", status: "DRAFT" }), { page: 1, limit: 12, search: "cs", studyLevel: "PHD", language: "ARABIC", faculty: "علوم", status: "DRAFT" });
  for (const [kind, params] of [["cities", { limit: 51 }], ["gallery", { limit: 101 }], ["programs", { page: 0 }], ["cities", { countryId: "bad" }]] as const) assert.throws(() => managementParams(kind, params));
});
test("program duration pairing and tuition yearly upsert never flatten opaque response history", () => {
  const values = sectionValues("programs", program); assert.equal(values.includeTuition, ""); assert.throws(() => sectionPayload("programs", values, program));
  const payload = sectionPayload("programs", { ...values, includeTuition: "yes", amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" }, program);
  assert.deepEqual(payload, { tuition: { amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" } });
  assert.deepEqual(sectionPayload("programs", { ...values, durationValue: "4", durationUnit: "YEARS" }, program), { durationValue: 4, durationUnit: "YEARS" });
  for (const amount of ["-1", "01", "1.234", "10000000000"]) assert.equal(tuitionInputSchema.safeParse({ amount, currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" }).success, false);
  assert.equal(programCreateSchema.safeParse({ ...program, durationValue: 4 }).success, false);
});
test("admission immutable target patch, scopes and publishing prerequisites", () => {
  assert.equal(requirementPatchSchema.safeParse({ scope: "PROGRAM", contentAr: "قبول" }).success, false);
  for (const input of [{ scope: "STUDY_LEVEL", contentAr: "قبول" }, { scope: "UNIVERSITY", studyLevel: "PHD", contentAr: "قبول" }, { scope: "PROGRAM", programId: recordId, studyLevel: "PHD", contentAr: "قبول" }, { scope: "UNIVERSITY", studyLevel: null, contentAr: "قبول" }]) assert.equal(requirementCreateSchema.safeParse(input).success, false);
  assert.equal(requirementCreateSchema.safeParse({ scope: "PROGRAM", programId: recordId, contentAr: "قبول" }).success, true);
  const values = sectionValues("admission-requirements", requirement);
  assert.deepEqual(sectionPayload("admission-requirements", { ...values, contentEn: "Requirements" }, requirement), { contentEn: "Requirements" });
  assert.throws(() => sectionPayload("admission-requirements", { ...values, status: "PUBLISHED" }, requirement));
  assert.equal(requirementCreateSchema.safeParse({ scope: "UNIVERSITY", contentAr: "قبول", status: "PUBLISHED", officialSourceUrl: "https://example.invalid", verifiedAt: dates.createdAt }).success, true);
});
test("gallery order loads beyond page one, removes archived and rejects incomplete sets", async () => {
  const old = apiClient.defaults.adapter; let mismatch = false; let count = 0;
  apiClient.defaults.adapter = async config => { count++; const page = config.params.page; const items = page === 1 ? Array.from({ length: 100 }, (_, i) => ({ ...image, id: `00000000-0000-4000-8000-${String(i + 10).padStart(12, "0")}`, status: "ARCHIVED" })) : [image]; return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: { items, pagination: { page, limit: 100, total: mismatch && page === 2 ? 102 : 101, totalPages: 2 } } } }; };
  try { assert.deepEqual(await loadGalleryOrder(universityId), [image]); assert.equal(count, 2); mismatch = true; await assert.rejects(loadGalleryOrder(universityId)); } finally { apiClient.defaults.adapter = old; }
  assert.equal(galleryOrderSchema.safeParse({ orderedIds: [recordId, recordId] }).success, false);
});
test("image multipart resource, signatures, limits, cancellation and server errors", async () => {
  const old = apiClient.defaults.adapter; let calls = 0; const controller = new AbortController();
  apiClient.defaults.adapter = async config => { calls++; assert.equal(config.url, "/admin/uploads/images"); assert.equal(config.method, "post"); assert.equal(config.withCredentials, true); assert.equal(config.signal, controller.signal); assert.ok(config.data instanceof FormData); assert.equal(config.data.get("resource"), "universities"); return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: { assetId: "asset", publicId: "universities/image", secureUrl: "https://example.invalid/image.png", format: "png", bytes: 12, width: 1, height: 1 } } }; };
  const file = new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], "local.png", { type: "image/png" });
  try { assert.equal((await uploadImage("universities", file, undefined, controller.signal)).format, "png"); await assert.rejects(uploadImage("universities", new File(["not png"], "bad.png", { type: "image/png" }))); assert.equal(calls, 1); } finally { apiClient.defaults.adapter = old; }
  assert.ok(validateImageFile(new File([new Uint8Array(4_000_001)], "large.png", { type: "image/png" }))); assert.ok(validateImageFile(new File(["svg"], "file.svg", { type: "image/svg+xml" })));
  assert.equal(normalizeApiError(new CanceledError()).kind, "cancelled");
  const error = new AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, { status: 400, statusText: "Bad Request", headers: {}, config: {} as never, data: { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid", details: { fields: { imageUrl: ["Invalid URL"] } } } } });
  assert.deepEqual(getApiFieldErrors(error), { imageUrl: ["Invalid URL"] });
});
test("new cache invalidation is university-scoped and Phase 1 stays untouched", async () => {
  const client = new QueryClient(); const own = queryKeys.admin.university.list(universityId, "programs", {}); const other = queryKeys.admin.university.list(recordId, "programs", {}); const phase1 = queryKeys.admin.submissions.list("applications", {});
  for (const key of [own, other, phase1]) client.setQueryData(key, []); await invalidateUniversitySection(client, universityId, "programs"); assert.equal(client.getQueryState(own)?.isInvalidated, true); assert.equal(client.getQueryState(other)?.isInvalidated, false); assert.equal(client.getQueryState(phase1)?.isInvalidated, false); client.clear();
});
test("failed new mutations retain original status/cause and never replay HTTP, network or cancellation failures", async () => {
  const old = apiClient.defaults.adapter;
  try {
    for (const status of [400, 401, 403, 404, 409, 413, 415, 500, 502, 503]) {
      let calls = 0; const failure = new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, { status, statusText: "Error", config: {} as never, headers: {}, data: { success: false, error: { code: "REQUEST_FAILED", message: "Failed", details: {} } } });
      apiClient.defaults.adapter = async () => { calls++; throw failure; };
      await assert.rejects(universitySectionApi.save("gallery", universityId, { altAr: "وصف" }, recordId), error => normalizeApiError(error).status === status && normalizeApiError(error).cause === failure); assert.equal(calls, 1);
    }
    for (const failure of [new CanceledError(), new AxiosError("Network failed", "ERR_NETWORK", undefined, {})]) {
      apiClient.defaults.adapter = async () => { throw failure; }; await assert.rejects(directoryApi.create("academic-majors", { slug: "cs", nameAr: "حاسوب", nameEn: "CS" }), error => normalizeApiError(error).cause === failure);
    }
  } finally { apiClient.defaults.adapter = old; }
});
test("proxy expands only documented paths; gallery detach requires trusted origin", () => {
  for (const path of ["admin/academic-majors/anything", `admin/university-programs/${recordId}/tuition`, `admin/universities/${universityId}/programs/${recordId}`, "admin/uploads/other"]) assert.equal(getAllowedDevApiEndpoint(path.split("/")), undefined);
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "university-programs", recordId])?.methods, ["PATCH", "OPTIONS"]);
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "university-gallery", recordId])?.methods, ["PATCH", "DELETE", "OPTIONS"]);
  const env = { NODE_ENV: "development", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3001" } as NodeJS.ProcessEnv;
  assert.equal(validateTrustedDevelopmentRequest(new Headers({ host: "localhost:3001" }), "DELETE", env).trusted, false);
});
test("existing editor mappings include normalized city and scholarship images without changing flat article blocks", () => {
  const values = initialContentValues("universities", university as never); assert.equal(values.universityType, "PUBLIC"); assert.equal(validateContentValues("universities", values).cityId, undefined);
  assert.equal(toContentPayload("universities", { ...values, cityId: recordId }).cityId, recordId); assert.equal(toContentPayload("universities", { ...values, universityType: "" }).universityType, undefined);
  assert.equal(toContentPayload("scholarships", { imageUrl: image.imageUrl }).imageUrl, image.imageUrl);
  assert.deepEqual(toContentPayload("articles", { bodyAr: [{ type: "paragraph", text: "نص" }] }).bodyAr, [{ type: "paragraph", text: "نص" }]);
});
