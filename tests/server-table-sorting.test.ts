import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");
const universities = source("components/content/universities-list-page.tsx");
const scholarships = source("components/content/scholarships-list-page.tsx");
const submissions = source("components/submissions/submission-list-page.tsx");
const sortableHeader = source("components/ui/sortable-table-header.tsx");
const contentApi = source("lib/api-client/content.ts");
const debounce = source("lib/search-debounce.ts");

test("desktop content tables use documented server-sort headers while mobile keeps synchronized controls", () => {
  assert.match(universities, /SortableTableHeader label="الجامعة"[\s\S]*?sort: "name"/);
  assert.match(universities, /SortableTableHeader label="تاريخ الإضافة"[\s\S]*?sort: "newest"/);
  assert.match(universities, /<div className="lg:hidden"><SearchableSelect label="ترتيب حسب"/);
  assert.match(scholarships, /SortableTableHeader[\s\S]*?label="المنحة"[\s\S]*?sort: "newest"/);
  assert.match(scholarships, /SortableTableHeader[\s\S]*?label="آخر موعد للتقديم"[\s\S]*?sort: "deadline"/);
  assert.match(scholarships, /<div className="lg:hidden">[\s\S]*?scholarships-sort-filter/);
  assert.match(contentApi, /UniversityListParams[\s\S]*?sort\?: "newest" \| "name"/);
  assert.match(contentApi, /ScholarshipListParams[\s\S]*?sort\?: "newest" \| "deadline"/);
});

test("submission date headers use the documented newest/oldest toggle and updated sort", () => {
  assert.match(submissions, /function toggleCreatedSort\(\)/);
  assert.match(submissions, /filters\.sort === "newest" \? "oldest" : "newest"/);
  assert.match(submissions, /label="تاريخ الإرسال"/);
  assert.match(submissions, /label="آخر تحديث"/);
  assert.match(submissions, /<div className="md:hidden">[\s\S]*?name="sort"/);
});

test("sortable headers are keyboard-accessible and expose the active server direction", () => {
  assert.match(sortableHeader, /aria-sort=\{active \? direction : "none"\}/);
  assert.match(sortableHeader, /type="button"/);
  assert.match(sortableHeader, /focus-visible:outline/);
  assert.match(debounce, /ADMIN_SEARCH_DEBOUNCE_MS = 1000/);
});
