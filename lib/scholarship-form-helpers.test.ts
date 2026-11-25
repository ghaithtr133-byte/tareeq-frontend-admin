import test from "node:test";
import assert from "node:assert/strict";

import type { Scholarship } from "@/lib/api-client/content";
import { initialContentValues, toContentPayload, validateContentValues } from "@/lib/content-form";
import {
  SCHOLARSHIP_ADVANCED_FIELD_NAMES,
  SCHOLARSHIP_SECTION_ANCHORS,
  SCHOLARSHIP_SLUG_REGEX,
  buildScholarshipPatch,
  isScholarshipUniversityCompatible,
  resolveAutoScholarshipSlug,
  scholarshipOptionDisplayLabel,
  suggestScholarshipSeoDescription,
  suggestScholarshipSeoTitle,
  transliterateArabicToSlug,
} from "@/lib/scholarship-form-helpers";

test("transliterateArabicToSlug produces clean valid Latin slugs or returns null when unmappable", () => {
  const s1 = transliterateArabicToSlug("منحة الهندسة للطلبة الدوليين");
  assert.ok(s1 && SCHOLARSHIP_SLUG_REGEX.test(s1));
  assert.equal(s1, "mnha-alhndsa-lltlba-aldwlyyn");

  const s2 = transliterateArabicToSlug("منحة ٢٠٢٦ جامعة 2");
  assert.ok(s2 && SCHOLARSHIP_SLUG_REGEX.test(s2));
  assert.ok(s2.includes("2026"));

  assert.equal(transliterateArabicToSlug("!!!"), null);
  assert.equal(transliterateArabicToSlug("ا"), null);
  assert.equal(transliterateArabicToSlug("   "), null);
});

test("resolveAutoScholarshipSlug prioritizes optional titleEn, falls back to Arabic transliteration, respects manual edits, and never alters Edit/Published slugs", () => {
  assert.deepEqual(
    resolveAutoScholarshipSlug({
      titleAr: "منحة الهندسة للطلبة الدوليين",
      titleEn: "",
      currentSlug: "",
      slugManuallyEdited: false,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "mnha-alhndsa-lltlba-aldwlyyn", source: "transliteration" },
  );

  assert.deepEqual(
    resolveAutoScholarshipSlug({
      titleAr: "منحة الهندسة",
      titleEn: "Engineering Excellence Grant 2026",
      currentSlug: "",
      slugManuallyEdited: false,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "engineering-excellence-grant-2026", source: "titleEn" },
  );

  assert.deepEqual(
    resolveAutoScholarshipSlug({
      titleAr: "منحة جديدة",
      titleEn: "New Grant",
      currentSlug: "custom-grant-url",
      slugManuallyEdited: true,
      isEditMode: false,
      isPublished: false,
    }),
    { slug: "custom-grant-url", source: "manual" },
  );

  // Edit mode never regenerates Slug when Arabic title changes
  assert.deepEqual(
    resolveAutoScholarshipSlug({
      titleAr: "عنوان محدّث بالكامل",
      titleEn: "Completely Updated Title",
      currentSlug: "original-scholarship-slug",
      slugManuallyEdited: false,
      isEditMode: true,
      isPublished: false,
    }),
    { slug: "original-scholarship-slug", source: "locked" },
  );

  // Published slug stays locked
  assert.deepEqual(
    resolveAutoScholarshipSlug({
      titleAr: "عنوان منشور",
      titleEn: "Published Title",
      currentSlug: "published-slug",
      slugManuallyEdited: true,
      isEditMode: true,
      isPublished: true,
    }),
    { slug: "published-slug", source: "locked" },
  );
});

test("SEO suggestions format concise Arabic metadata within backend limits", () => {
  assert.equal(suggestScholarshipSeoTitle("منحة الهندسة", "تركيا"), "منحة الهندسة - تركيا");
  assert.equal(suggestScholarshipSeoTitle("منحة تركيا للطلبة الدوليين", "تركيا"), "منحة تركيا للطلبة الدوليين");
  assert.equal(suggestScholarshipSeoTitle("   "), "");

  const longDesc = "فرصة دراسية مميزة في التخصصات الهندسية والطبية ".repeat(14);
  const seoDesc = suggestScholarshipSeoDescription(longDesc, "");
  assert.ok(seoDesc.length > 0 && seoDesc.length <= 280);
});

test("scholarshipOptionDisplayLabel maps technical codes to Arabic while preserving Arabic labels", () => {
  assert.equal(scholarshipOptionDisplayLabel("studyLevel", "BACHELORS"), "بكالوريوس");
  assert.equal(scholarshipOptionDisplayLabel("studyLevel", "ماجستير"), "ماجستير");
  assert.equal(scholarshipOptionDisplayLabel("fundingType", "FULL_FUNDING"), "تمويل كامل");
  assert.equal(scholarshipOptionDisplayLabel("fundingType", "تمويل جزئي"), "تمويل جزئي");
});

test("Scholarship Create works without English fields and buildScholarshipPatch preserves hidden EN fields and immutable published slug", () => {
  const createValues = initialContentValues("scholarships");
  createValues.titleAr = "منحة التميز الأكاديمي";
  createValues.slug = "academic-excellence";
  createValues.studyLevel = "بكالوريوس";
  createValues.fundingType = "تمويل كامل";
  createValues.descriptionAr = "وصف واضح للمنحة ومزاياها الأساسية.";
  createValues.requirementsAr = "شهادة ثانوية بمعدل مرتفع وإثبات لغة.";

  assert.deepEqual(validateContentValues("scholarships", createValues), {});
  const createPayload = toContentPayload("scholarships", createValues);
  assert.equal(createPayload.titleEn, undefined);
  assert.equal(createPayload.slug, "academic-excellence");

  const stored: Scholarship = {
    id: "67a1dc3c-c31b-43dd-b7dd-ddf957b4ec14",
    slug: "jordan-engineering-scholarship",
    featured: true,
    publishedAt: "2026-02-01T08:00:00.000Z",
    seoTitleAr: "منحة هندسية",
    seoDescriptionAr: "وصف SEO محفوظ",
    titleAr: "منحة الهندسة للطلبة الدوليين",
    titleEn: "Engineering Scholarship for International Students",
    countryId: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
    universityId: "d6465d5f-5d39-4bd1-ac2a-2d5eae2b3252",
    studyLevel: "بكالوريوس",
    fundingType: "تمويل جزئي",
    requirementsAr: "سجل أكاديمي جيد وإثبات لغة.",
    requirementsEn: "Good academic record and language evidence.",
    descriptionAr: "منحة مساندة لدراسة الهندسة.",
    descriptionEn: "A supporting scholarship for engineering study.",
    verifiedDeadline: "2026-09-01T12:00:00.000Z",
    officialSourceUrl: "https://www.ju.edu.jo",
    applicationStatus: "OPEN",
    effectiveApplicationStatus: "OPEN",
    imageUrl: null,
    imageAltAr: null,
    imageAltEn: "Engineering scholarship EN alt",
    status: "PUBLISHED",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T09:00:00.000Z",
  };

  const editValues = initialContentValues("scholarships", stored);
  editValues.titleAr = "منحة الهندسة للطلبة الدوليين 2026";
  // Even if someone forces slug in memory on a published scholarship, patch strips slug cleanly
  editValues.slug = "tampered-slug";

  const patch = buildScholarshipPatch(editValues, stored);
  assert.deepEqual(patch, { titleAr: "منحة الهندسة للطلبة الدوليين 2026" });
  assert.equal("slug" in patch, false);
  assert.equal("requirementsEn" in patch, false);
  assert.equal("descriptionEn" in patch, false);
  assert.equal("imageAltEn" in patch, false);
  assert.equal("seoTitleAr" in patch, false);
  assert.equal("seoDescriptionAr" in patch, false);

  assert.equal(isScholarshipUniversityCompatible("c1", "c1"), true);
  assert.equal(isScholarshipUniversityCompatible("c1", "c2"), false);
  assert.equal(isScholarshipUniversityCompatible("", "c2"), true);
  assert.ok(SCHOLARSHIP_ADVANCED_FIELD_NAMES.has("slug"));
  assert.equal(SCHOLARSHIP_SECTION_ANCHORS.length, 4);
});

