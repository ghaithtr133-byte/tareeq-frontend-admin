import test from "node:test";
import assert from "node:assert/strict";

import {
  COUNTRY_ADVANCED_FIELD_NAMES,
  COUNTRY_SECTION_ANCHORS,
  COUNTRY_SLUG_REGEX,
  lookupArabicCountrySlug,
  normalizeEnglishToSlug,
  resolveAutoCountrySlug,
  suggestCountrySeoDescription,
  suggestCountrySeoTitle,
} from "@/lib/country-form-helpers";
import { initialContentValues, toContentPatch, toContentPayload, validateContentValues } from "@/lib/content-form";
import type { Country } from "@/lib/api-client/content";

test("lookupArabicCountrySlug maps common Arabic destinations reliably to lowercase valid slugs", () => {
  assert.equal(lookupArabicCountrySlug("مصر"), "egypt");
  assert.equal(lookupArabicCountrySlug("جمهورية مصر العربية"), "egypt");
  assert.equal(lookupArabicCountrySlug("ألمانيا"), "germany");
  assert.equal(lookupArabicCountrySlug("الإمارات العربية المتحدة"), "united-arab-emirates");
  assert.equal(lookupArabicCountrySlug("المملكة المتحدة"), "united-kingdom");
  assert.equal(lookupArabicCountrySlug("تركيا"), "turkey");
  assert.equal(lookupArabicCountrySlug("كوريا الجنوبية"), "south-korea");

  for (const sample of ["مصر", "ألمانيا", "الأردن", "ماليزيا", "تركيا"]) {
    const slug = lookupArabicCountrySlug(sample);
    assert.ok(slug && COUNTRY_SLUG_REGEX.test(slug));
  }
});

test("lookupArabicCountrySlug and normalizeEnglishToSlug return null rather than arbitrary invalid slugs when unmappable", () => {
  assert.equal(lookupArabicCountrySlug("وجهة غير معروفة تماما"), null);
  assert.equal(normalizeEnglishToSlug("مصر"), null);
  assert.equal(normalizeEnglishToSlug("a"), null);
  assert.equal(normalizeEnglishToSlug("   "), null);
  assert.equal(normalizeEnglishToSlug("United States & Canada"), "united-states-and-canada");
  assert.equal(normalizeEnglishToSlug("Czech Republic!!"), "czech-republic");
});

test("resolveAutoCountrySlug prefers nameEn, falls back to Arabic dictionary, respects manual lock, and never alters Edit/Published slugs", () => {
  // Dictionary fallback on Create without English name
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "مصر",
      nameEn: "",
      currentSlug: "",
      slugManuallyEdited: false,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "egypt", source: "dictionary" },
  );

  // Explicit English name overrides dictionary when not manually edited
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "مصر",
      nameEn: "Arab Republic of Egypt",
      currentSlug: "egypt",
      slugManuallyEdited: false,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "arab-republic-of-egypt", source: "nameEn" },
  );

  // Manual override prevents automatic overwrite
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "تركيا",
      nameEn: "Republic of Turkey",
      currentSlug: "study-in-turkey",
      slugManuallyEdited: true,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "study-in-turkey", source: "manual" },
  );

  // Edit mode never auto-alters existing slug
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "ألمانيا",
      nameEn: "Federal Republic of Germany",
      currentSlug: "germany",
      slugManuallyEdited: false,
      isEditMode: true,
      isPublished: false,
    }),
    { slug: "germany", source: "locked" },
  );

  // Published record slug stays strictly locked
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "الأردن",
      nameEn: "Hashemite Kingdom of Jordan",
      currentSlug: "jordan",
      slugManuallyEdited: false,
      isEditMode: true,
      isPublished: true,
    }),
    { slug: "jordan", source: "locked" },
  );

  // Unreliable Arabic name without English input yields empty fallback prompt state
  assert.deepEqual(
    resolveAutoCountrySlug({
      nameAr: "كازاخستان",
      nameEn: "",
      currentSlug: "",
      slugManuallyEdited: false,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "", source: "none" },
  );
});

test("SEO suggestions derive clean Arabic metadata without exceeding backend field limits", () => {
  assert.equal(suggestCountrySeoTitle("تركيا"), "الدراسة في تركيا");
  assert.equal(suggestCountrySeoTitle("   "), "");

  const longIntro = "تعد تركيا واحدة من أبرز الوجهات الدراسية ".repeat(15);
  const desc = suggestCountrySeoDescription(longIntro);
  assert.ok(desc.length > 0 && desc.length <= 280);
});

test("Country Create works without English fields and Edit PATCH preserves hidden English fields & displayOrder", () => {
  const createValues = initialContentValues("countries");
  createValues.nameAr = "ماليزيا";
  createValues.slug = "malaysia";
  createValues.introductionAr = "وجهة تعليمية متقدمة في آسيا.";
  createValues.detailsAr = "تضم جامعات معترفًا بها دوليًا وتكاليف معيشة مناسبة.";

  assert.deepEqual(validateContentValues("countries", createValues), {});
  const createPayload = toContentPayload("countries", createValues);
  assert.equal(createPayload.nameEn, undefined);
  assert.equal(createPayload.slug, "malaysia");

  const stored: Country = {
    id: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
    slug: "jordan",
    featured: true,
    publishedAt: "2026-01-12T08:00:00.000Z",
    seoTitleAr: "عنوان محفوظ مسبقًا",
    seoDescriptionAr: "وصف محفوظ مسبقًا",
    nameAr: "الأردن",
    nameEn: "Jordan",
    introductionAr: "مقدمة عربية",
    introductionEn: "Stored English intro",
    detailsAr: "تفاصيل عربية",
    detailsEn: "Stored English details",
    imageUrl: "https://example.com/jordan.jpg",
    imageAltAr: "الأردن",
    imageAltEn: "Jordan EN",
    overviewImageUrl: null,
    overviewImageAltAr: null,
    studyLanguageAr: "العربية والإنجليزية",
    tuitionSummaryAr: null,
    admissionSummaryAr: null,
    applicationDatesSummaryAr: null,
    displayOrder: 4,
    status: "PUBLISHED",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T09:00:00.000Z",
  };

  const editValues = initialContentValues("countries", stored);
  editValues.studyLanguageAr = "العربية والإنجليزية في التخصصات الطبية";
  const patch = toContentPatch("countries", editValues, stored);
  assert.deepEqual(patch, { studyLanguageAr: "العربية والإنجليزية في التخصصات الطبية" });
  assert.equal("slug" in patch, false);
  assert.equal("seoTitleAr" in patch, false);
  assert.equal("introductionEn" in patch, false);
  assert.equal("displayOrder" in patch, false);
  assert.ok(COUNTRY_ADVANCED_FIELD_NAMES.has("slug"));
});

test("COUNTRY_SECTION_ANCHORS exposes the 4 simplified high-level section groups", () => {
  assert.equal(COUNTRY_SECTION_ANCHORS.length, 4);
  assert.deepEqual(
    COUNTRY_SECTION_ANCHORS.map((item) => item.id),
    [
      "country-group-basic",
      "country-group-content",
      "country-group-media",
      "country-group-publishing",
    ],
  );
});

