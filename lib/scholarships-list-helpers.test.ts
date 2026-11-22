import test from "node:test";
import assert from "node:assert/strict";

import {
  SCHOLARSHIP_SORT_OPTIONS,
  SCHOLARSHIP_STATUS_FILTER_OPTIONS,
  SCHOLARSHIPS_PAGE_LIMIT,
  buildScholarshipsFilterUrlParams,
  countActiveScholarshipsSecondaryFilters,
  formatScholarshipDeadline,
  formatScholarshipUpdatedAt,
  formatScholarshipsPaginationSummary,
  hasActiveScholarshipsFilters,
  parseScholarshipsListFilters,
  scholarshipApplicationStatusLabel,
  scholarshipPublicationStatusLabel,
} from "@/lib/scholarships-list-helpers";

test("parseScholarshipsListFilters enforces limit=12, defaults sort=newest, omits legacy UI university filters, and obeys featured=true contract", () => {
  const parsed = parseScholarshipsListFilters({
    page: "2",
    limit: "50",
    search: "  هندسة  ",
    country: "turkey",
    status: "PUBLISHED",
    applicationStatus: "OPEN",
    sort: "deadline",
    featured: "false",
    university: "metu",
    studyLevel: "بكالوريوس",
    fundingType: "تمويل كامل",
    universitySearch: "legacy",
    universityMajor: "cs",
  });

  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, SCHOLARSHIPS_PAGE_LIMIT);
  assert.equal(parsed.search, "هندسة");
  assert.equal(parsed.country, "turkey");
  assert.equal(parsed.status, "PUBLISHED");
  assert.equal(parsed.applicationStatus, "OPEN");
  assert.equal(parsed.sort, "deadline");
  assert.equal("featured" in parsed, false);
  assert.equal(parsed.university, "metu");
  assert.equal(parsed.studyLevel, "بكالوريوس");
  assert.equal(parsed.fundingType, "تمويل كامل");
  assert.equal("universitySearch" in parsed, false);
  assert.equal("universityMajor" in parsed, false);

  const featuredOn = parseScholarshipsListFilters({ featured: "true", sort: "manual" });
  assert.equal(featuredOn.featured, "true");
  assert.equal(featuredOn.sort, "newest");
});

test("buildScholarshipsFilterUrlParams resets page on filter change and omits limit/default sort/false featured", () => {
  const current = parseScholarshipsListFilters({
    page: "3",
    country: "jordan",
    featured: "true",
    sort: "deadline",
  });

  const next = buildScholarshipsFilterUrlParams(current, {
    featured: undefined,
    status: "DRAFT",
  });

  assert.equal(next.get("page"), "1");
  assert.equal(next.get("country"), "jordan");
  assert.equal(next.get("status"), "DRAFT");
  assert.equal(next.get("sort"), "deadline");
  assert.equal(next.has("featured"), false);
  assert.equal(next.has("limit"), false);

  const paged = buildScholarshipsFilterUrlParams(current, { page: 4 }, { resetPage: false });
  assert.equal(paged.get("page"), "4");
});

test("countActiveScholarshipsSecondaryFilters and hasActiveScholarshipsFilters track active states accurately", () => {
  const base = parseScholarshipsListFilters({});
  assert.equal(countActiveScholarshipsSecondaryFilters(base), 0);
  assert.equal(hasActiveScholarshipsFilters(base), false);

  const withSecondary = parseScholarshipsListFilters({
    university: "ju",
    fundingType: "تمويل جزئي",
  });
  assert.equal(countActiveScholarshipsSecondaryFilters(withSecondary), 2);
  assert.equal(hasActiveScholarshipsFilters(withSecondary), true);

  const withSortOnly = parseScholarshipsListFilters({ sort: "deadline" });
  assert.equal(countActiveScholarshipsSecondaryFilters(withSortOnly), 0);
  assert.equal(hasActiveScholarshipsFilters(withSortOnly), true);
});

test("formatScholarshipDeadline handles absent, invalid, future, and expired dates cleanly without inventing dates", () => {
  const referenceNow = Date.parse("2026-11-20T12:00:00.000Z");

  assert.deepEqual(formatScholarshipDeadline(null, referenceNow), {
    label: "غير محدد",
    isSpecified: false,
    isExpired: false,
  });
  assert.deepEqual(formatScholarshipDeadline("not-a-date", referenceNow), {
    label: "غير محدد",
    isSpecified: false,
    isExpired: false,
  });

  const expired = formatScholarshipDeadline("2026-09-01T12:00:00.000Z", referenceNow);
  assert.equal(expired.isSpecified, true);
  assert.equal(expired.isExpired, true);
  assert.ok(expired.label.length > 0 && expired.label !== "غير محدد");

  const upcoming = formatScholarshipDeadline("2027-03-15T12:00:00.000Z", referenceNow);
  assert.equal(upcoming.isSpecified, true);
  assert.equal(upcoming.isExpired, false);
  assert.ok(upcoming.label.length > 0 && upcoming.label !== "غير محدد");
});

test("status, sort, updatedAt, and pagination helpers use exact Arabic labels", () => {
  assert.deepEqual(SCHOLARSHIP_SORT_OPTIONS, [
    { value: "newest", label: "الأحدث إضافةً" },
    { value: "deadline", label: "الأقرب لانتهاء التقديم" },
  ]);
  assert.deepEqual(SCHOLARSHIP_STATUS_FILTER_OPTIONS, [
    { value: "DRAFT", label: "مسودة" },
    { value: "PUBLISHED", label: "منشورة" },
    { value: "ARCHIVED", label: "مؤرشفة" },
  ]);

  assert.equal(scholarshipPublicationStatusLabel("DRAFT"), "مسودة");
  assert.equal(scholarshipPublicationStatusLabel("PUBLISHED"), "منشورة");
  assert.equal(scholarshipPublicationStatusLabel("ARCHIVED"), "مؤرشفة");

  assert.equal(scholarshipApplicationStatusLabel("OPEN"), "التقديم مفتوح");
  assert.equal(scholarshipApplicationStatusLabel("CLOSED"), "التقديم مغلق");

  assert.equal(formatScholarshipUpdatedAt(null), "—");
  assert.ok(formatScholarshipUpdatedAt("2026-02-12T09:00:00.000Z") !== "—");

  assert.deepEqual(formatScholarshipsPaginationSummary(1, 12, 27), {
    start: 1,
    end: 12,
    total: 27,
    rangeText: "1–12",
    label: "عرض 1–12 من أصل 27 منحة",
  });
  assert.equal(formatScholarshipsPaginationSummary(1, 12, 0).label, "عرض 0 من أصل 0 منحة");
});

