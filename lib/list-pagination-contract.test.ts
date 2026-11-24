import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("content lists keep desktop paging server-side and request mobile cards in batches of five", () => {
  for (const [path, resource] of [
    ["components/content/countries-list-page.tsx", "countries"],
    ["components/content/scholarships-list-page.tsx", "scholarships"],
    ["components/content/universities-list-page.tsx", "universities"],
  ] as const) {
    const file = source(path);
    assert.match(file, new RegExp(`useInfiniteContentList\\("${resource}",[\\s\\S]*?, 5, desktop === false\\)`));
    assert.match(file, /new IntersectionObserver/);
    assert.match(file, /desktop && pagination/);
    assert.match(file, /new Map<string,/);
  }
});

test("directory cards retain five-item server batches, automatic loading and an accessible fallback", () => {
  for (const path of [
    "components/universities/cities-management-page.tsx",
    "components/universities/academic-majors-management-page.tsx",
  ]) {
    const file = source(path);
    assert.match(file, /limit: 5/);
    assert.match(file, /new IntersectionObserver/);
    assert.match(file, /تحميل المزيد/);
    assert.match(file, /تم عرض كل/);
  }
});

test("list controls do not expose page-size selectors", () => {
  assert.doesNotMatch(source("components/content/countries-list-page.tsx"), /COUNTRY_PAGE_LIMIT_OPTIONS/);
  assert.doesNotMatch(source("components/faqs/faq-page.tsx"), /aria-label="عدد السجلات"/);
});
