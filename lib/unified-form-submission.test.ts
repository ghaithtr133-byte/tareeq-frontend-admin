import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("content parent forms expose one save path and keep established save guards", () => {
  for (const path of [
    "components/content/content-form-page.tsx",
    "components/content/country-form-page.tsx",
    "components/content/scholarship-form-page.tsx",
  ]) {
    const file = source(path);
    assert.doesNotMatch(file, /حفظ ومتابعة|حفظ وإنهاء|متابعة التفاصيل|حفظ ودليل الدراسة/);
    assert.match(file, /submissionRef\.current/);
  }

  const country = source("components/content/country-form-page.tsx");
  assert.match(country, /mainImageUploadRef\.current \|\| overviewImageUploadRef\.current/);
  assert.match(country, /statusChanged: Boolean\(formState\.dirtyFields\.status\)/);

  const scholarship = source("components/content/scholarship-form-page.tsx");
  assert.match(scholarship, /buildScholarshipPatch\(values, scholarshipRecord/);
  assert.match(scholarship, /statusChanged: Boolean\(formState\.dirtyFields\.status\)/);
});

test("catalog and FAQ dialogs retain exactly one submit button", () => {
  for (const path of [
    "components/universities/cities-management-page.tsx",
    "components/universities/academic-majors-management-page.tsx",
    "components/faqs/faq-editor.tsx",
  ]) {
    const file = source(path);
    assert.equal((file.match(/type="submit"/g) ?? []).length, 1, path);
  }
});

test("unified save navigation does not enter a related-content flow", () => {
  const generic = source("components/content/content-form-page.tsx");
  const country = source("components/content/country-form-page.tsx");
  const scholarship = source("components/content/scholarship-form-page.tsx");
  assert.match(generic, /router\.replace\(`\/admin\/\$\{resource\}`\)/);
  assert.match(country, /router\.replace\("\/admin\/countries"\)/);
  assert.match(scholarship, /router\.replace\("\/admin\/scholarships"\)/);
  assert.doesNotMatch(scholarship, /parentId=\${result\.id\}/);
});
