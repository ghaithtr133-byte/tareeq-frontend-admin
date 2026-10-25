import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";

import { apiClient } from "@/api/client";
import { contentApi } from "@/api/content";
import { getApiFieldErrors, normalizeApiError } from "@/api/error";
import { invalidateContentAfterCreate } from "@/hook/mutations/use-content-mutations";
import { toContentPayload } from "@/lib/content-form";

const recordId = "00000000-0000-4000-8000-000000000001";

test("all Admin content resource functions preserve the documented methods, paths, and list parameters", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const requests: Array<{ method?: string; url?: string; params?: unknown }> = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, params: config.params });
    const isList = config.method === "get" && !config.url?.endsWith(recordId);
    return {
      config,
      data: { success: true, data: isList ? { items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } } : { id: recordId } },
      headers: {},
      status: config.method === "post" ? 201 : 200,
      statusText: "OK",
    };
  };

  try {
    await contentApi.countries.list({ page: 1, limit: 12, search: "الأردن", featured: "true", sort: "manual", status: "PUBLISHED" });
    await contentApi.countries.get(recordId);
    await contentApi.countries.create({ nameAr: "الأردن", introductionAr: "مقدمة", detailsAr: "تفاصيل", slug: "jordan" });
    await contentApi.countries.update(recordId, { status: "ARCHIVED" });

    await contentApi.universities.list({ page: 1, limit: 12, search: "جامعة", country: "jordan", featured: "true", sort: "name", status: "PUBLISHED" });
    await contentApi.universities.get(recordId);
    await contentApi.universities.create({ nameAr: "جامعة", officialName: "University", countryId: recordId, cityAr: "عمّان", overviewAr: "نبذة", slug: "university" });
    await contentApi.universities.update(recordId, { featured: true });

    await contentApi.scholarships.list({ page: 1, limit: 12, search: "منحة", country: "jordan", university: "university", studyLevel: "MASTERS", fundingType: "FULL", applicationStatus: "OPEN", featured: "true", sort: "deadline", status: "PUBLISHED" });
    await contentApi.scholarships.get(recordId);
    await contentApi.scholarships.create({ titleAr: "منحة", studyLevel: "MASTERS", fundingType: "FULL", requirementsAr: "متطلبات", descriptionAr: "وصف", slug: "scholarship" });
    await contentApi.scholarships.update(recordId, { applicationStatus: "CLOSED" });

    await contentApi.services.list({ page: 1, limit: 12, featured: "false", sort: "manual", status: "DRAFT" });
    await contentApi.services.get(recordId);
    await contentApi.services.create({ titleAr: "خدمة", summaryAr: "ملخص", descriptionAr: "وصف", slug: "service" });
    await contentApi.services.update(recordId, { displayOrder: 4 });

    await contentApi.articles.list({ page: 1, limit: 12, search: "مقال", country: "jordan", featured: "false", sort: "newest", status: "DRAFT" });
    await contentApi.articles.get(recordId);
    await contentApi.articles.create({ titleAr: "مقال", summaryAr: "ملخص", bodyAr: [{ type: "paragraph", text: "نص" }], slug: "article" });
    await contentApi.articles.update(recordId, { bodyEn: null });
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }

  assert.deepEqual(
    requests.map(({ method, url }) => `${method} ${url}`),
    [
      "get /admin/countries", `get /admin/countries/${recordId}`, "post /admin/countries", `patch /admin/countries/${recordId}`,
      "get /admin/universities", `get /admin/universities/${recordId}`, "post /admin/universities", `patch /admin/universities/${recordId}`,
      "get /admin/scholarships", `get /admin/scholarships/${recordId}`, "post /admin/scholarships", `patch /admin/scholarships/${recordId}`,
      "get /admin/services", `get /admin/services/${recordId}`, "post /admin/services", `patch /admin/services/${recordId}`,
      "get /admin/articles", `get /admin/articles/${recordId}`, "post /admin/articles", `patch /admin/articles/${recordId}`,
    ],
  );
  assert.deepEqual(requests[4]?.params, { page: 1, limit: 12, search: "جامعة", country: "jordan", featured: "true", sort: "name", status: "PUBLISHED" });
  assert.deepEqual(requests[8]?.params, { page: 1, limit: 12, search: "منحة", country: "jordan", university: "university", studyLevel: "MASTERS", fundingType: "FULL", applicationStatus: "OPEN", featured: "true", sort: "deadline", status: "PUBLISHED" });
  assert.deepEqual(requests[16]?.params, { page: 1, limit: 12, search: "مقال", country: "jordan", featured: "false", sort: "newest", status: "DRAFT" });
  assert.equal(apiClient.defaults.withCredentials, true);
});

test("documented validation envelopes preserve the HTTP status, cause, and field messages", () => {
  const cause = new AxiosError("Validation failed", undefined, undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: {} } as never,
    data: { success: false, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: { fields: { slug: ["المعرّف النصي مستخدم بالفعل."] } } } },
  });

  const normalized = normalizeApiError(cause);
  assert.equal(normalized.kind, "http");
  assert.equal(normalized.status, 400);
  assert.equal(normalized.cause, cause);
  assert.deepEqual(getApiFieldErrors(cause), { slug: ["المعرّف النصي مستخدم بالفعل."] });
});

test("form serialization preserves null relationships and the documented flat article block format", () => {
  assert.deepEqual(
    toContentPayload("scholarships", {
      titleAr: "منحة", studyLevel: "MASTERS", fundingType: "FULL", requirementsAr: "متطلبات", descriptionAr: "وصف", slug: "scholarship",
      countryId: "", universityId: "", verifiedDeadline: "", officialSourceUrl: "", featured: false, status: "DRAFT",
    }),
    { titleAr: "منحة", countryId: null, universityId: null, studyLevel: "MASTERS", fundingType: "FULL", requirementsAr: "متطلبات", descriptionAr: "وصف", verifiedDeadline: null, officialSourceUrl: null, slug: "scholarship", featured: false, status: "DRAFT" },
  );
  assert.deepEqual(
    toContentPayload("articles", {
      titleAr: "مقال", summaryAr: "ملخص", slug: "article", featured: true, status: "DRAFT",
      countryId: "", universityId: "", scholarshipId: "",
      bodyAr: [{ type: "heading2", text: "عنوان" }], bodyEn: [],
    }),
    { titleAr: "مقال", summaryAr: "ملخص", countryId: null, universityId: null, scholarshipId: null, slug: "article", featured: true, status: "DRAFT", bodyAr: [{ type: "heading2", text: "عنوان" }], bodyEn: null },
  );
});

test("successful creates invalidate both collection and relationship-selector caches", async () => {
  const invalidated: unknown[] = [];
  await invalidateContentAfterCreate({
    invalidateQueries: async (filters: { queryKey?: readonly unknown[] }) => { invalidated.push(filters.queryKey); },
  } as never);
  assert.deepEqual(invalidated, [
    ["admin", "content", "list"],
    ["admin", "content", "selectors"],
  ]);
});
