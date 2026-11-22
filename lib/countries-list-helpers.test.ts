import test from "node:test";
import assert from "node:assert/strict";

import {
  COUNTRY_STATUS_FILTER_OPTIONS,
  countryFlagFromCode,
  countryInitialGlyph,
  countryPublicationStatusLabel,
  formatCountriesPaginationSummary,
  formatCountryAddedDate,
  hasActiveCountriesFilters,
  isSafeCountryThumbnailUrl,
} from "@/lib/countries-list-helpers";

test("COUNTRY_STATUS_FILTER_OPTIONS exposes exact Arabic labels in expected order", () => {
  assert.deepEqual(COUNTRY_STATUS_FILTER_OPTIONS, [
    { value: "", label: "جميع الحالات" },
    { value: "DRAFT", label: "مسودة" },
    { value: "PUBLISHED", label: "منشورة" },
    { value: "ARCHIVED", label: "مؤرشفة" },
  ]);

  assert.equal(countryPublicationStatusLabel("DRAFT"), "مسودة");
  assert.equal(countryPublicationStatusLabel("PUBLISHED"), "منشورة");
  assert.equal(countryPublicationStatusLabel("ARCHIVED"), "مؤرشفة");
});

test("formatCountriesPaginationSummary formats Arabic range and clamps boundaries cleanly", () => {
  assert.deepEqual(formatCountriesPaginationSummary(1, 10, 42), {
    start: 1,
    end: 10,
    total: 42,
    rangeText: "1–10",
    label: "عرض 1–10 من أصل 42 دولة",
  });

  assert.deepEqual(formatCountriesPaginationSummary(5, 10, 42), {
    start: 41,
    end: 42,
    total: 42,
    rangeText: "41–42",
    label: "عرض 41–42 من أصل 42 دولة",
  });

  assert.deepEqual(formatCountriesPaginationSummary(1, 12, 2), {
    start: 1,
    end: 2,
    total: 2,
    rangeText: "1–2",
    label: "عرض 1–2 من أصل 2 دولة",
  });

  assert.equal(formatCountriesPaginationSummary(1, 12, 0).label, "عرض 0 من أصل 0 دولة");
});

test("countryFlagFromCode and isSafeCountryThumbnailUrl validate inputs strictly without inventing data", () => {
  assert.equal(countryFlagFromCode("jo"), "🇯🇴");
  assert.equal(countryFlagFromCode("TR"), "🇹🇷");
  assert.equal(countryFlagFromCode("jordan"), null);
  assert.equal(countryFlagFromCode(null), null);

  assert.equal(isSafeCountryThumbnailUrl("https://cdn.example.com/jo.png"), "https://cdn.example.com/jo.png");
  assert.equal(isSafeCountryThumbnailUrl("javascript:alert(1)"), null);
  assert.equal(isSafeCountryThumbnailUrl("  "), null);

  assert.equal(countryInitialGlyph("الأردن"), "ا");
  assert.equal(countryInitialGlyph("تركيا"), "ت");
  assert.equal(countryInitialGlyph(""), "د");
});

test("hasActiveCountriesFilters ignores sort/page/limit and treats featured!=true as inactive", () => {
  assert.equal(hasActiveCountriesFilters({}), false);
  assert.equal(hasActiveCountriesFilters({ search: "   ", featured: "false" }), false);
  assert.equal(hasActiveCountriesFilters({ search: "تركيا" }), true);
  assert.equal(hasActiveCountriesFilters({ status: "PUBLISHED" }), true);
  assert.equal(hasActiveCountriesFilters({ featured: "true" }), true);
});

test("formatCountryAddedDate handles valid ISO dates and missing/invalid dates gracefully", () => {
  assert.equal(formatCountryAddedDate(null), "—");
  assert.equal(formatCountryAddedDate("not-a-date"), "—");
  const formatted = formatCountryAddedDate("2026-01-10T09:00:00.000Z");
  assert.ok(formatted.length > 0 && formatted !== "—");
});

