import assert from "node:assert/strict";
import test from "node:test";

import {
  activeArticlesAdditionalFilters,
  ARTICLES_DESKTOP_PAGE_LIMIT,
  ARTICLES_MOBILE_PAGE_LIMIT,
  ARTICLE_STATUS_FILTER_OPTIONS,
  buildArticlesFilterUrlParams,
  formatArticleDate,
  formatArticlesPaginationSummary,
  hasActiveArticlesFilters,
  parseArticlesListFilters,
} from "@/lib/articles-list-helpers";

test("article list filters use only documented server parameters and fixed desktop page size", () => {
  const filters = parseArticlesListFilters({
    page: "3",
    limit: "50",
    search: "  هندسة  ",
    country: "jordan",
    status: "PUBLISHED",
    featured: "false",
    university: "unsupported",
    scholarship: "unsupported",
    sort: "title",
  });

  assert.equal(filters.page, 3);
  assert.equal(filters.limit, ARTICLES_DESKTOP_PAGE_LIMIT);
  assert.equal(filters.search, "هندسة");
  assert.equal(filters.country, "jordan");
  assert.equal(filters.status, "PUBLISHED");
  assert.equal(filters.sort, "newest");
  assert.equal("featured" in filters, false);
  assert.equal("university" in filters, false);
  assert.equal("scholarship" in filters, false);
  assert.equal(ARTICLES_MOBILE_PAGE_LIMIT, 5);
});

test("article list URL state resets pages, omits false featured, and preserves server-side filters", () => {
  const filters = parseArticlesListFilters({ page: "4", country: "jordan", featured: "true" });
  const filtered = buildArticlesFilterUrlParams(filters, { search: "مقال" });
  assert.equal(filtered.get("page"), "1");
  assert.equal(filtered.get("country"), "jordan");
  assert.equal(filtered.get("featured"), "true");
  assert.equal(filtered.get("search"), "مقال");
  assert.equal(filtered.has("limit"), false);
  assert.equal(filtered.has("sort"), false);

  const unfeatured = buildArticlesFilterUrlParams(filters, { featured: undefined });
  assert.equal(unfeatured.has("featured"), false);
  const pageTwo = buildArticlesFilterUrlParams(filters, { page: 2 }, { resetPage: false });
  assert.equal(pageTwo.get("page"), "2");
});

test("article helpers expose exact status labels and truthful active-filter summaries", () => {
  assert.deepEqual(ARTICLE_STATUS_FILTER_OPTIONS, [
    { value: "DRAFT", label: "مسودة" },
    { value: "PUBLISHED", label: "منشورة" },
    { value: "ARCHIVED", label: "مؤرشفة" },
  ]);
  assert.equal(hasActiveArticlesFilters(parseArticlesListFilters({})), false);
  const countryOnly = parseArticlesListFilters({ country: "jordan" });
  assert.equal(hasActiveArticlesFilters(countryOnly), true);
  assert.equal(activeArticlesAdditionalFilters(countryOnly), 1);
  assert.equal(formatArticleDate(null), "—");
  assert.ok(formatArticleDate("2026-01-10T09:00:00.000Z") !== "—");
  assert.equal(formatArticlesPaginationSummary(1, 12, 16), "عرض 1–12 من أصل 16 مقال");
  assert.equal(formatArticlesPaginationSummary(1, 5, 0), "عرض 0 من أصل 0 مقال");
});
