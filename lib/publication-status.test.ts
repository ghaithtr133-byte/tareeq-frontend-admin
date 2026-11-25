import assert from "node:assert/strict";
import test from "node:test";

import type { Article, ContentRecord, Country, Scholarship, Service, University } from "@/lib/api-client/content";
import { initialContentValues, toContentPatch } from "@/lib/content-form";
import { buildScholarshipPatch } from "@/lib/scholarship-form-helpers";

const id = "00000000-0000-4000-8000-000000000001";
const timestamps = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" };

function country(status: Country["status"] = "PUBLISHED"): Country {
  return {
    id, slug: "jordan", featured: true, publishedAt: status === "PUBLISHED" ? timestamps.createdAt : null,
    seoTitleAr: "عنوان", seoDescriptionAr: "وصف", nameAr: "الأردن", nameEn: "Jordan",
    introductionAr: "مقدمة", introductionEn: "Introduction", detailsAr: "تفاصيل", detailsEn: "Details",
    imageUrl: "https://example.invalid/country-old.png", imageAltAr: "صورة قديمة", imageAltEn: "Old image",
    displayOrder: 1, status, ...timestamps,
  };
}

function university(status: University["status"] = "PUBLISHED"): University {
  return {
    id, slug: "university", featured: false, publishedAt: status === "PUBLISHED" ? timestamps.createdAt : null,
    seoTitleAr: "عنوان", seoDescriptionAr: "وصف", nameAr: "جامعة الاختبار", nameEn: "Test University",
    officialName: "Test University", countryId: id, cityAr: "عمّان", cityEn: "Amman", overviewAr: "نبذة",
    summaryAr: "ملخص", overviewEn: "Overview", officialWebsite: "https://example.invalid", imageUrl: "https://example.invalid/university-old.png",
    imageAltAr: "صورة قديمة", imageAltEn: "Old image", status, ...timestamps,
  };
}

function scholarship(status: Scholarship["status"] = "PUBLISHED"): Scholarship {
  return {
    id, slug: "scholarship", featured: false, publishedAt: status === "PUBLISHED" ? timestamps.createdAt : null,
    seoTitleAr: "عنوان", seoDescriptionAr: "وصف", titleAr: "منحة الاختبار", titleEn: "Test Scholarship",
    countryId: id, universityId: id, studyLevel: "MASTERS", fundingType: "FULL", requirementsAr: "متطلبات",
    requirementsEn: "Requirements", descriptionAr: "وصف", descriptionEn: "Description", verifiedDeadline: null,
    officialSourceUrl: null, applicationStatus: "OPEN", imageUrl: "https://example.invalid/scholarship-old.png",
    imageAltAr: "صورة قديمة", imageAltEn: "Old image", status, ...timestamps,
  };
}

function service(status: Service["status"] = "PUBLISHED"): Service {
  return {
    id, slug: "service", featured: false, publishedAt: status === "PUBLISHED" ? timestamps.createdAt : null,
    seoTitleAr: "عنوان", seoDescriptionAr: "وصف", titleAr: "خدمة الاختبار", titleEn: "Test Service",
    summaryAr: "ملخص", summaryEn: "Summary", descriptionAr: "وصف", descriptionEn: "Description",
    imageUrl: "https://example.invalid/service-old.png", imageAltAr: "صورة قديمة", imageAltEn: "Old image",
    displayOrder: 1, status, ...timestamps,
  };
}

function article(status: Article["status"] = "PUBLISHED"): Article {
  return {
    id, slug: "article", featured: false, publishedAt: status === "PUBLISHED" ? timestamps.createdAt : null,
    seoTitleAr: "عنوان", seoDescriptionAr: "وصف", titleAr: "مقال الاختبار", titleEn: "Test Article",
    summaryAr: "ملخص", summaryEn: "Summary", bodyAr: [{ type: "paragraph", text: "نص" }], bodyEn: null,
    coverImageUrl: "https://example.invalid/article-old.png", coverImageAltAr: "غلاف قديم", coverImageAltEn: "Old cover",
    countryId: id, universityId: null, scholarshipId: null, status, ...timestamps,
  };
}

test("TA-110: published parent-content image edits preserve status and publication metadata", () => {
  const records: Array<["countries" | "universities" | "services" | "articles", ContentRecord, string]> = [
    ["countries", country(), "imageUrl"],
    ["universities", university(), "imageUrl"],
    ["services", service(), "imageUrl"],
    ["articles", article(), "coverImageUrl"],
  ];

  for (const [resource, record, imageField] of records) {
    const values = initialContentValues(resource, record);
    assert.equal(values.status, "PUBLISHED", `${resource} edit initialization`);
    const patch = toContentPatch(resource, { ...values, [imageField]: "https://example.invalid/replacement.png" }, record, { statusChanged: false });
    assert.deepEqual(patch, { [imageField]: "https://example.invalid/replacement.png" }, `${resource} image PATCH`);
    assert.equal("publishedAt" in patch, false, `${resource} must not write publication metadata`);
  }

  const scholarshipRecord = scholarship();
  const scholarshipPatch = buildScholarshipPatch(
    { ...initialContentValues("scholarships", scholarshipRecord), imageUrl: "https://example.invalid/replacement.png" },
    scholarshipRecord,
    { statusChanged: false },
  );
  assert.deepEqual(scholarshipPatch, { imageUrl: "https://example.invalid/replacement.png" });
});

test("TA-110: text and related-data edits preserve PUBLISHED, DRAFT, and ARCHIVED states", () => {
  const publishedArticle = article();
  assert.deepEqual(
    toContentPatch("articles", { ...initialContentValues("articles", publishedArticle), summaryAr: "ملخص محدّث", scholarshipIds: [id] }, publishedArticle, { statusChanged: false }),
    { summaryAr: "ملخص محدّث", scholarshipIds: [id] },
  );

  for (const [status, record] of [["DRAFT", country("DRAFT")], ["ARCHIVED", country("ARCHIVED")]] as const) {
    const patch = toContentPatch("countries", { ...initialContentValues("countries", record), nameAr: `الأردن ${status}` }, record, { statusChanged: false });
    assert.deepEqual(patch, { nameAr: `الأردن ${status}` });
  }
});

test("TA-110: only an explicit status control change sends a status transition", () => {
  const publishedCountry = country();
  const publishedValues = initialContentValues("countries", publishedCountry);

  assert.deepEqual(
    toContentPatch("countries", { ...publishedValues, status: "DRAFT", imageUrl: "https://example.invalid/replacement.png" }, publishedCountry, { statusChanged: false }),
    { imageUrl: "https://example.invalid/replacement.png" },
  );
  assert.deepEqual(
    toContentPatch("countries", { ...publishedValues, status: "ARCHIVED" }, publishedCountry, { statusChanged: true }),
    { status: "ARCHIVED" },
  );

  const draftUniversity = university("DRAFT");
  assert.deepEqual(
    toContentPatch("universities", { ...initialContentValues("universities", draftUniversity), status: "PUBLISHED" }, draftUniversity, { statusChanged: true }),
    { status: "PUBLISHED" },
  );
});

test("TA-110: a successful image upload only changes the image field for the follow-up save", () => {
  const record = scholarship();
  const values = initialContentValues("scholarships", record);
  // This mirrors the upload callback: it sets only the uploaded image URL.
  const patch = buildScholarshipPatch({ ...values, imageUrl: "https://example.invalid/uploaded.png" }, record, { statusChanged: false });
  assert.deepEqual(patch, { imageUrl: "https://example.invalid/uploaded.png" });
});
