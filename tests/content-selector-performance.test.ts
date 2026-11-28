import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const queryHook = readFileSync("hook/queries/use-content-queries.ts", "utf8");
const searchableSelect = readFileSync("components/ui/searchable-select.tsx", "utf8");
const contentForm = readFileSync("components/content/content-form-page.tsx", "utf8");
const scholarshipForm = readFileSync("components/content/scholarship-form-page.tsx", "utf8");
const articleScholarships = readFileSync("components/content/article-scholarships.tsx", "utf8");
const universitiesList = readFileSync("components/content/universities-list-page.tsx", "utf8");
const scholarshipsList = readFileSync("components/content/scholarships-list-page.tsx", "utf8");
const articlesList = readFileSync("components/content/articles-list-page.tsx", "utf8");
const directorySlugSelect = readFileSync("components/content/directory-slug-select.tsx", "utf8");
const universityManagementQueries = readFileSync("hook/queries/use-university-management.ts", "utf8");
const relationshipSelector = queryHook.slice(
  queryHook.indexOf("export function useContentSelector"),
  queryHook.indexOf("function useContentFilterOptions"),
);

test("relationship selectors fetch a small server page only after opening and debounce global search", () => {
  assert.match(queryHook, /CONTENT_SELECTOR_PAGE_SIZE = 20/);
  assert.match(queryHook, /useDebouncedValue\(search, ADMIN_SEARCH_DEBOUNCE_MS\)/);
  assert.match(queryHook, /const isSearchPending = search\.trim\(\) !== debouncedSearch\.trim\(\)/);
  assert.match(queryHook, /items: isSearchPending \? \[\] : items/);
  assert.match(queryHook, /useInfiniteQuery/);
  assert.match(queryHook, /enabled: available && open/);
  assert.match(queryHook, /staleTime: CONTENT_SELECTOR_STALE_TIME/);
  assert.match(queryHook, /\{ signal \}/);
  assert.doesNotMatch(relationshipSelector, /Promise\.all\(Array\.from/);
});

test("shared select provides accessible incremental loading with a manual Arabic fallback", () => {
  assert.match(searchableSelect, /onOpenChange/);
  assert.match(searchableSelect, /onScroll=\{handleListScroll\}/);
  assert.match(searchableSelect, /loadMorePendingRef/);
  assert.match(searchableSelect, /function requestMore/);
  assert.match(searchableSelect, /تحميل المزيد/);
  assert.match(searchableSelect, /جارٍ تحميل المزيد/);
  assert.match(searchableSelect, /تم عرض جميع النتائج/);
});

test("content relationship fields use the lazy server-backed selector without losing saved selections", () => {
  for (const source of [contentForm, scholarshipForm, articleScholarships]) {
    assert.match(source, /useContentSelector/);
    assert.match(source, /hasMore/);
    assert.match(source, /onLoadMore/);
  }
  assert.match(contentForm, /selectedLabel/);
  assert.match(scholarshipForm, /selectedLabel/);
  assert.match(articleScholarships, /selected\.find/);
  assert.match(contentForm, /ابحث في جميع الدول/);
  assert.match(contentForm, /ابحث في جميع الجامعات/);
  assert.match(scholarshipForm, /ابحث في جميع الدول/);
  assert.match(scholarshipForm, /ابحث في جميع الجامعات/);
  assert.match(articleScholarships, /ابحث في جميع المنح/);
  assert.doesNotMatch(articleScholarships, /limit: 50/);
  assert.doesNotMatch(scholarshipForm, /limit: 50/);
});

test("content list relationship filters use lazy global selectors instead of eager option catalogs", () => {
  for (const source of [universitiesList, scholarshipsList, articlesList]) {
    assert.match(source, /useContentSelector/);
    assert.doesNotMatch(source, /useContentSelectors/);
    assert.match(source, /onOpenChange/);
    assert.match(source, /hasMore/);
    assert.match(source, /placeholder="الكل"/);
  }
  assert.match(scholarshipsList, /params: universitySelectorParams/);
  assert.match(scholarshipsList, /country: filters\.country/);
  assert.doesNotMatch(scholarshipsList, /allUniversities\.filter/);
});

test("core content lists retain 1000ms server-search debouncing and page-reset paths", () => {
  for (const source of [universitiesList, scholarshipsList, articlesList]) {
    assert.match(source, /<DebouncedSearchBar[\s\S]*?delayMs=\{1000\}/);
  }
  assert.match(scholarshipsList, /resetPage: true/);
  assert.match(articlesList, /resetPage = true/);
  assert.match(universitiesList, /resetPage = true/);
});

test("directory relationship filters are lazy, globally searchable and paginated", () => {
  assert.match(directorySlugSelect, /useDirectorySelector/);
  assert.doesNotMatch(directorySlugSelect, /useDirectoryList/);
  assert.match(directorySlugSelect, /onOpenChange/);
  assert.match(directorySlugSelect, /ابحث في جميع المدن/);
  assert.match(directorySlugSelect, /ابحث في جميع التخصصات/);
  assert.match(directorySlugSelect, /hasMore/);
  assert.match(universityManagementQueries, /DIRECTORY_SELECTOR_PAGE_SIZE = 20/);
  assert.match(universityManagementQueries, /setTimeout\(\(\) => setDebouncedSearch\(search\), ADMIN_SEARCH_DEBOUNCE_MS\)/);
  assert.match(universityManagementQueries, /enabled: available && open/);
  assert.match(universityManagementQueries, /\{ signal \}/);
});
