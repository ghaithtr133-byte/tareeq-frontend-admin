import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { Country, Scholarship } from "@/lib/api-client/content";
import {
  applyArticleSeoDefaults,
  applyCountrySeoDefaults,
  applyScholarshipSeoDefaults,
  initialContentValues,
  toContentPatch,
} from "@/lib/content-form";

const dates = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

const country: Country = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "jordan",
  featured: false,
  publishedAt: "2026-01-01T00:00:00.000Z",
  seoTitleAr: "الأردن",
  seoDescriptionAr: "وجهة دراسية موثوقة",
  nameAr: "الأردن",
  nameEn: "Jordan",
  introductionAr: "وجهة دراسية موثوقة",
  introductionEn: "Stored English introduction",
  detailsAr: "تفاصيل الدراسة في الأردن",
  detailsEn: "Stored English details",
  imageUrl: "https://example.invalid/jordan.jpg",
  imageAltAr: "صورة الأردن",
  imageAltEn: "Stored English alt",
  displayOrder: 1,
  status: "PUBLISHED",
  ...dates,
};

const scholarship: Scholarship = {
  id: "00000000-0000-4000-8000-000000000002",
  slug: "engineering-grant",
  featured: false,
  publishedAt: "2026-01-01T00:00:00.000Z",
  seoTitleAr: "منحة الهندسة",
  seoDescriptionAr: "وصف المنحة",
  titleAr: "منحة الهندسة",
  titleEn: "Engineering grant",
  countryId: country.id,
  universityId: null,
  studyLevel: "BACHELOR",
  fundingType: "FULL",
  requirementsAr: "متطلبات المنحة",
  requirementsEn: "Stored English requirements",
  descriptionAr: "وصف المنحة",
  descriptionEn: "Stored English description",
  verifiedDeadline: null,
  officialSourceUrl: null,
  applicationStatus: "OPEN",
  imageUrl: "https://example.invalid/scholarship.jpg",
  imageAltAr: "صورة المنحة",
  imageAltEn: "Stored English alt",
  status: "PUBLISHED",
  ...dates,
};

test("Country SEO is generated from actual Arabic content and does not leak into an unrelated PATCH", () => {
  const create = applyCountrySeoDefaults({
    ...initialContentValues("countries"),
    nameAr: "<strong>الأردن</strong>",
    introductionAr: "وجهة <em>دراسية</em> موثوقة",
    detailsAr: "تفاصيل احتياطية",
  });
  assert.equal(create.seoTitleAr, "الأردن");
  assert.equal(create.seoDescriptionAr, "وجهة دراسية موثوقة");

  const unrelated = applyCountrySeoDefaults(
    { ...initialContentValues("countries", country), featured: true },
    country,
  );
  assert.deepEqual(toContentPatch("countries", unrelated, country, { statusChanged: false }), { featured: true });

  const changed = applyCountrySeoDefaults(
    { ...initialContentValues("countries", country), introductionAr: "مقدمة محدثة" },
    country,
  );
  assert.deepEqual(toContentPatch("countries", changed, country, { statusChanged: false }), {
    introductionAr: "مقدمة محدثة",
    seoDescriptionAr: "مقدمة محدثة",
  });
});

test("Country custom SEO and historical English fields are preserved during ordinary edits", () => {
  const custom = { ...country, seoTitleAr: "عنوان مخصص", seoDescriptionAr: "وصف مخصص" };
  const values = applyCountrySeoDefaults(
    { ...initialContentValues("countries", custom), nameAr: "الأردن الجديد" },
    custom,
  );
  assert.deepEqual(toContentPatch("countries", values, custom, { statusChanged: false }), { nameAr: "الأردن الجديد" });
  assert.equal(values.nameEn, "Jordan");
  assert.equal(values.slug, "jordan");
  assert.equal(values.status, "PUBLISHED");
});

test("Scholarship SEO uses the actual current contract fields and preserves custom metadata", () => {
  const create = applyScholarshipSeoDefaults({
    ...initialContentValues("scholarships"),
    titleAr: "منحة العلوم",
    descriptionAr: "<p>وصف موجز</p>",
    requirementsAr: "متطلبات احتياطية",
  });
  assert.equal(create.seoTitleAr, "منحة العلوم");
  assert.equal(create.seoDescriptionAr, "وصف موجز");

  const changed = applyScholarshipSeoDefaults(
    { ...initialContentValues("scholarships", scholarship), titleAr: "منحة الهندسة المتقدمة" },
    scholarship,
  );
  assert.deepEqual(toContentPatch("scholarships", changed, scholarship, { statusChanged: false }), {
    titleAr: "منحة الهندسة المتقدمة",
    seoTitleAr: "منحة الهندسة المتقدمة",
  });

  const custom = { ...scholarship, seoDescriptionAr: "وصف SEO مخصص" };
  const customValues = applyScholarshipSeoDefaults(
    { ...initialContentValues("scholarships", custom), descriptionAr: "وصف محدث" },
    custom,
  );
  assert.deepEqual(toContentPatch("scholarships", customValues, custom, { statusChanged: false }), {
    descriptionAr: "وصف محدث",
  });
});

test("Article SEO no longer adds branding and known legacy automatic titles may update", () => {
  const create = applyArticleSeoDefaults({ titleAr: "مقال تعليمي", summaryAr: "ملخص المقال" });
  assert.equal(create.seoTitleAr, "مقال تعليمي");
  assert.equal(create.seoDescriptionAr, "ملخص المقال");
});

test("supported Admin forms do not render manual SEO controls or manual country/scholarship image URLs", () => {
  const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");
  const countryForm = source("components/content/country-form-page.tsx");
  const scholarshipForm = source("components/content/scholarship-form-page.tsx");
  const sharedForm = source("components/content/content-form-page.tsx");
  const articleSections = sharedForm.slice(sharedForm.indexOf("  articles: ["), sharedForm.indexOf("\nfunction fieldDirection", sharedForm.indexOf("  articles: [")));

  assert.doesNotMatch(countryForm, /countries-seo(?:Title|Description)Ar/);
  assert.doesNotMatch(scholarshipForm, /scholarships-seo(?:Title|Description)Ar/);
  assert.doesNotMatch(articleSections, /seoTitleAr|seoDescriptionAr/);
  assert.equal((countryForm.match(/manualUrlAvailable=\{false\}/g) ?? []).length, 2);
  assert.match(scholarshipForm, /manualUrlAvailable=\{false\}/);
});
