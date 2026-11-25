import test from "node:test";
import assert from "node:assert/strict";

import { contentDefinitions } from "@/lib/content-config";
import {
  buildContentFilterUrlParams,
  countActiveContentFilters,
  parseContentListFilters,
} from "@/lib/content-filters";
import {
  initialContentValues,
  toContentPatch,
  toContentPayload,
} from "@/lib/content-form";
import {
  studyLevelLabel,
  teachingLanguageLabel,
  universityTypeLabel,
} from "@/lib/content-labels";
import type { Country, Service, University } from "@/lib/api-client/content";

test("featured switch OFF omits featured param completely and ignores featured=false", () => {
  const offParams = parseContentListFilters("countries", { featured: "false" });
  assert.equal("featured" in offParams, false);

  const onParams = parseContentListFilters("countries", { featured: "true" });
  assert.equal(onParams.featured, "true");

  const urlOff = buildContentFilterUrlParams(
    { featured: "true", page: 3 },
    { featured: undefined },
  );
  assert.equal(urlOff.has("featured"), false);
  assert.equal(urlOff.get("page"), "1");
});

test("services list omits status filter and manual sort option", () => {
  assert.equal(contentDefinitions.services.filters.includes("status"), false);
  assert.equal(contentDefinitions.services.filters.includes("search"), false);
  assert.equal(
    contentDefinitions.services.sorts.some((s) => s.value === "manual"),
    false,
  );
  assert.equal(
    contentDefinitions.countries.sorts.some((s) => s.value === "manual"),
    false,
  );

  const parsed = parseContentListFilters("services", {
    status: "PUBLISHED",
    sort: "manual",
  });
  assert.equal("status" in parsed, false);
  assert.equal(parsed.sort, "newest");
});

test("scholarship universityFeatured treats non-true as unset and counts secondary filters", () => {
  const parsed = parseContentListFilters("scholarships", {
    country: "jordan",
    universityFeatured: "false",
    universityType: "PUBLIC",
  });
  assert.equal("universityFeatured" in parsed, false);
  assert.equal(parsed.universityType, "PUBLIC");

  const counts = countActiveContentFilters(
    "scholarships",
    parsed as unknown as Record<string, string | number | undefined>,
  );
  assert.equal(counts.primary, 1);
  assert.equal(counts.secondary, 1);
  assert.equal(counts.total, 2);
});

test("hiding optional English fields and displayOrder preserves stored data on PATCH", () => {
  const existingCountry: Country = {
    id: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
    slug: "jordan",
    featured: true,
    publishedAt: "2026-01-12T08:00:00.000Z",
    seoTitleAr: "الدراسة في الأردن",
    seoDescriptionAr: "دليل الدراسة في الأردن",
    nameAr: "الأردن",
    nameEn: "Jordan",
    introductionAr: "مقدمة عربية",
    introductionEn: "Stored English intro that must NOT be deleted",
    detailsAr: "تفاصيل عربية",
    detailsEn: "Stored English details that must NOT be deleted",
    imageUrl: "https://example.com/flag.jpg",
    imageAltAr: "علم الأردن",
    imageAltEn: "Jordan flag alt",
    displayOrder: 7,
    status: "PUBLISHED",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T09:00:00.000Z",
  };

  // Hidden fields are marked uiHidden in config
  const hiddenNames = contentDefinitions.countries.fields
    .filter((f) => f.uiHidden)
    .map((f) => f.name);
  assert.ok(hiddenNames.includes("introductionEn"));
  assert.ok(hiddenNames.includes("detailsEn"));
  assert.ok(hiddenNames.includes("imageAltEn"));
  assert.ok(hiddenNames.includes("displayOrder"));
  assert.equal(hiddenNames.includes("nameEn"), false);

  // Edit only Arabic name -> PATCH must ONLY contain nameAr, never blanking hidden fields or displayOrder
  const values = initialContentValues("countries", existingCountry);
  values.nameAr = "المملكة الأردنية الهاشمية";
  const patch = toContentPatch("countries", values, existingCountry);

  assert.deepEqual(patch, { nameAr: "المملكة الأردنية الهاشمية" });
  assert.equal("introductionEn" in patch, false);
  assert.equal("detailsEn" in patch, false);
  assert.equal("displayOrder" in patch, false);
});

test("hidden optional fields on universities and services also remain untouched on PATCH", () => {
  const existingUni: University = {
    id: "d6465d5f-5d39-4bd1-ac2a-2d5eae2b3252",
    slug: "university-of-jordan",
    featured: true,
    publishedAt: "2026-01-12T08:00:00.000Z",
    seoTitleAr: null,
    seoDescriptionAr: null,
    nameAr: "الجامعة الأردنية",
    nameEn: "The University of Jordan",
    officialName: "The University of Jordan",
    countryId: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
    cityAr: "عمّان",
    cityEn: "Amman",
    overviewAr: "نبذة عربية",
    summaryAr: null,
    overviewEn: "Stored English overview",
    officialWebsite: "https://www.ju.edu.jo",
    imageUrl: null,
    imageAltAr: null,
    imageAltEn: "Stored cover alt EN",
    logoUrl: null,
    logoAltAr: null,
    logoAltEn: "Stored logo alt EN",
    universityType: "PUBLIC",
    status: "PUBLISHED",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T09:00:00.000Z",
  };

  const uniValues = initialContentValues("universities", existingUni);
  uniValues.cityAr = "عمان - الجبيهة";
  const uniPatch = toContentPatch("universities", uniValues, existingUni);
  assert.deepEqual(uniPatch, { cityAr: "عمان - الجبيهة" });

  const existingService: Service = {
    id: "e2e4b4c5-1f20-4ecb-a76d-7c5937074e7c",
    slug: "application-guidance",
    featured: true,
    publishedAt: "2026-01-15T08:00:00.000Z",
    seoTitleAr: null,
    seoDescriptionAr: null,
    titleAr: "إرشاد التقديم",
    titleEn: "Application Guidance",
    summaryAr: "ملخص",
    summaryEn: "Stored English summary",
    descriptionAr: "وصف",
    descriptionEn: "Stored English description",
    imageUrl: null,
    imageAltAr: null,
    imageAltEn: null,
    displayOrder: 4,
    status: "PUBLISHED",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T09:00:00.000Z",
  };

  const svcValues = initialContentValues("services", existingService);
  svcValues.featured = false;
  const svcPatch = toContentPatch("services", svcValues, existingService);
  assert.deepEqual(svcPatch, { featured: false });

  // Verify create payload for countries defaults displayOrder=0 cleanly without throwing
  const newCountryValues = initialContentValues("countries");
  newCountryValues.nameAr = "ألمانيا";
  newCountryValues.slug = "germany";
  newCountryValues.introductionAr = "مقدمة";
  newCountryValues.detailsAr = "تفاصيل";
  const createPayload = toContentPayload("countries", newCountryValues);
  assert.equal(createPayload.displayOrder, 0);
  assert.equal("introductionEn" in createPayload, false);
});

test("Arabic label mappers translate technical enums while falling back safely", () => {
  assert.equal(studyLevelLabel("BACHELORS"), "بكالوريوس");
  assert.equal(studyLevelLabel("بكالوريوس"), "بكالوريوس");
  assert.equal(teachingLanguageLabel("GERMAN"), "الألمانية");
  assert.equal(universityTypeLabel("PRIVATE"), "خاصة");
  assert.equal(universityTypeLabel(null), "غير محدد");
});

