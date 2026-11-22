import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError, CanceledError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client/client";
import { contentApi, type University } from "@/lib/api-client/content";
import { directoryApi, loadGalleryOrder, managementParams, universitySectionApi } from "@/lib/api-client/university-management";
import { studyLanguageCatalogApi } from "@/lib/api-client/study-languages";
import { uploadImage, validateImageFile } from "@/lib/api-client/images";
import { normalizeApiError, getApiFieldErrors } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { invalidateUniversitySection } from "@/hook/mutations/use-university-management";
import { galleryOrderSchema, programCreateSchema, requirementCreateSchema, requirementPatchSchema, tuitionInputSchema } from "@/lib/university-schemas";
import { sectionPayload, sectionValues } from "@/lib/university-form";
import { applyUniversitySeoDefaults, initialContentValues, toContentPatch, toContentPayload, validateContentValues } from "@/lib/content-form";
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
    await directoryApi.updateAcademicMajor(majorId, { nameAr: "علوم الحاسوب التطبيقية" }); await directoryApi.deleteAcademicMajor(majorId);
    await directoryApi.updateCity(recordId, { nameAr: "عمّان الجديدة" }); await directoryApi.deleteCity(recordId);
    for (const section of ["programs", "admission-requirements", "gallery"] as const) { await universitySectionApi.list(section, universityId, { status: "DRAFT" }); await universitySectionApi.save(section, universityId, section === "programs" ? { academicMajorId: majorId, nameAr: "برنامج", studyLevel: "BACHELORS", languages: ["ENGLISH"], officialSourceUrl: "https://example.invalid", verifiedAt: dates.createdAt } : section === "gallery" ? { imageUrl: image.imageUrl } : { scope: "UNIVERSITY", contentAr: "قبول" }); await universitySectionApi.save(section, universityId, { status: "ARCHIVED" }, recordId); }
    await universitySectionApi.detach(recordId); await universitySectionApi.reorder(universityId, [recordId]);
    assert.equal(calls.length, 23); // Multipart upload is verified separately below.
    for (const call of calls) { const endpoint = getAllowedDevApiEndpoint(call.url!.split("/").filter(Boolean)); assert.ok(endpoint?.methods.includes(call.method!.toUpperCase()), `${call.method} ${call.url}`); }
    assert.deepEqual(calls[0].params, { major: "computer-science", city: "amman", studyLevel: "BACHELORS", language: "ENGLISH", universityType: "PUBLIC", status: "DRAFT" });
    assert.equal(calls[3].data, '{"cityId":null}');
    assert.equal(calls[8].url, `/admin/academic-majors/${majorId}`);
    assert.equal(calls[8].method, "patch");
    assert.equal(calls[9].url, `/admin/academic-majors/${majorId}`);
    assert.equal(calls[9].method, "delete");
    assert.equal(calls[10].url, `/admin/cities/${recordId}`);
    assert.equal(calls[10].method, "patch");
    assert.equal(calls[11].url, `/admin/cities/${recordId}`);
    assert.equal(calls[11].method, "delete");
  } finally { apiClient.defaults.adapter = old; }
});
test("pagination defaults, caps and supported filters only", () => {
  assert.deepEqual(managementParams("academic-majors", { status: "DRAFT" }), { page: 1, limit: 12 });
  assert.deepEqual(managementParams("gallery", {}), { page: 1, limit: 50 });
  assert.deepEqual(managementParams("programs", { search: " cs ", studyLevel: "PHD", language: "ARABIC", faculty: "علوم", status: "DRAFT" }), { page: 1, limit: 12, search: "cs", studyLevel: "PHD", language: "ARABIC", faculty: "علوم", status: "DRAFT" });
  for (const [kind, params] of [["cities", { limit: 51 }], ["gallery", { limit: 101 }], ["programs", { page: 0 }], ["cities", { countryId: "bad" }]] as const) assert.throws(() => managementParams(kind, params));
});
test("program duration pairing and tuition yearly upsert never flatten response history", () => {
  const values = sectionValues("programs", program); assert.equal(values.includeTuition, ""); assert.throws(() => sectionPayload("programs", values, program));
  const payload = sectionPayload("programs", { ...values, includeTuition: "yes", amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" }, program);
  assert.deepEqual(payload, { tuition: { amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" } });
  assert.deepEqual(sectionPayload("programs", { ...values, durationValue: "4", durationUnit: "YEARS" }, program), { durationValue: 4, durationUnit: "YEARS" });
  for (const amount of ["-1", "01", "1.234", "10000000000"]) assert.equal(tuitionInputSchema.safeParse({ amount, currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027" }).success, false);
  assert.equal(programCreateSchema.safeParse({ ...program, durationValue: 4 }).success, false);
});
test("admission immutable target patch, scopes and publishing prerequisites", () => {
  assert.equal(requirementPatchSchema.safeParse({ scope: "PROGRAM", contentAr: "قبول" }).success, false);
  for (const input of [{ scope: "STUDY_LEVEL", contentAr: "قبول" }, { scope: "UNIVERSITY", studyLevel: "PHD", contentAr: "قبول" }, { scope: "PROGRAM", programId: recordId, studyLevel: "PHD", contentAr: "قبول" }, { scope: "STUDY_LEVEL", studyLevel: null, contentAr: "قبول" }]) assert.equal(requirementCreateSchema.safeParse(input).success, false);
  assert.equal(requirementCreateSchema.safeParse({ scope: "UNIVERSITY", studyLevel: null, contentAr: "قبول" }).success, true);
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
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "cities", recordId])?.methods, ["PATCH", "DELETE", "OPTIONS"]);
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "academic-majors", recordId])?.methods, ["PATCH", "DELETE", "OPTIONS"]);
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "university-gallery", recordId])?.methods, ["PATCH", "DELETE", "OPTIONS"]);
  const env = { NODE_ENV: "development", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3001" } as NodeJS.ProcessEnv;
  assert.equal(validateTrustedDevelopmentRequest(new Headers({ host: "localhost:3001" }), "DELETE", env).trusted, false);
});
test("existing editor mappings include normalized city and scholarship images without changing flat article blocks", () => {
  const values = initialContentValues("universities", university as never); assert.equal(values.universityType, "PUBLIC"); assert.equal(validateContentValues("universities", values).cityId, undefined);
  assert.equal(toContentPayload("universities", { ...values, cityId: recordId }).cityId, recordId); assert.equal(toContentPayload("universities", { ...values, universityType: "" }).universityType, null);
  assert.equal(toContentPayload("scholarships", { imageUrl: image.imageUrl }).imageUrl, image.imageUrl);
  assert.deepEqual(toContentPayload("articles", { bodyAr: [{ type: "paragraph", text: "نص" }] }).bodyAr, [{ type: "paragraph", text: "نص" }]);
});

test("university summary and automatic SEO preserve unrelated stored fields on PATCH", () => {
  const record = {
    ...university,
    summaryAr: null,
    nameEn: "Local University",
    cityEn: "Amman",
    overviewEn: "Stored English overview",
    logoUrl: "https://example.invalid/logo.png",
    imageUrl: "https://example.invalid/cover.png",
    seoTitleAr: university.nameAr,
    seoDescriptionAr: university.overviewAr,
  } as unknown as University;
  const values = initialContentValues("universities", record);
  const next = applyUniversitySeoDefaults({ ...values, summaryAr: "وصف مختصر مستقل" }, record);
  assert.deepEqual(toContentPatch("universities", next, record), {
    summaryAr: "وصف مختصر مستقل",
    seoDescriptionAr: "وصف مختصر مستقل",
  });
  assert.equal(toContentPayload("universities", { ...values, summaryAr: "" }).summaryAr, null);

  const custom = { ...record, seoDescriptionAr: "وصف SEO مخصص" };
  const customNext = applyUniversitySeoDefaults({ ...initialContentValues("universities", custom), overviewAr: "نبذة محدثة" }, custom);
  assert.deepEqual(toContentPatch("universities", customNext, custom), { overviewAr: "نبذة محدثة" });
  const unrelatedEdit = toContentPatch("universities", { ...values, featured: true }, record);
  assert.deepEqual(unrelatedEdit, { featured: true });
  for (const key of ["nameEn", "cityEn", "overviewEn", "slug", "seoTitleAr", "seoDescriptionAr", "logoUrl", "imageUrl", "cityId", "programs", "admissionRequirements", "gallery"]) {
    assert.equal(key in unrelatedEdit, false);
  }
});

test("study-language catalog retains backend codes and the local proxy allows only its documented read", async () => {
  const original = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async (config) => ({
    config,
    headers: {},
    status: 200,
    statusText: "OK",
    data: {
      success: true,
      data: {
        items: [
          {
            id: recordId,
            code: "KOREAN",
            nameAr: "الكورية",
            isActive: true,
            sortOrder: 30,
            createdAt: dates.createdAt,
            updatedAt: dates.updatedAt,
          },
        ],
      },
    },
  });
  try {
    assert.deepEqual(await studyLanguageCatalogApi.list(), [
      {
        id: recordId,
        code: "KOREAN",
        nameAr: "الكورية",
        isActive: true,
        sortOrder: 30,
        createdAt: dates.createdAt,
        updatedAt: dates.updatedAt,
      },
    ]);
  } finally {
    apiClient.defaults.adapter = original;
  }
  assert.equal(programCreateSchema.safeParse({ academicMajorId: majorId, nameAr: "برنامج", studyLevel: "BACHELORS", languages: ["KOREAN"], officialSourceUrl: "https://example.invalid", verifiedAt: dates.createdAt }).success, true);
  assert.deepEqual(managementParams("programs", { language: "KOREAN" }), { page: 1, limit: 12, language: "KOREAN" });
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "study-languages"]), { path: "/admin/study-languages", methods: ["GET", "OPTIONS"] });
  assert.equal(getAllowedDevApiEndpoint(["admin", "study-languages", "anything"]), undefined);
});
