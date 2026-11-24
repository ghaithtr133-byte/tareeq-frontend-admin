import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "components/layout/admin-shell.tsx"),
  "utf8",
);
const dialogStart = source.indexOf("ref={profileDialogRef}");
const dialogSource = source.slice(dialogStart);

test("TA-100: Profile Dialog is bounded by the dynamic viewport and scrolls only its content", () => {
  assert.ok(dialogStart > -1);
  assert.match(dialogSource, /100dvh-env\(safe-area-inset-top\)-env\(safe-area-inset-bottom\)/);
  assert.match(dialogSource, /overflow-hidden/);
  assert.match(dialogSource, /overflow-y-auto overscroll-contain/);
  assert.match(dialogSource, /<footer className="shrink-0 border-t/);
  assert.match(dialogSource, /pb-\[max\(0\.875rem,env\(safe-area-inset-bottom\)\)\]/);
});

test("TA-100: Profile action controls fit narrow screens and the unavailable Save cannot fake success", () => {
  assert.match(dialogSource, /flex flex-col gap-2\.5 sm:flex-row/);
  assert.match(dialogSource, /grid w-full gap-2 sm:flex sm:w-auto/);
  assert.match(dialogSource, /حفظ التغييرات غير متاح/);
  assert.match(dialogSource, /disabled/);
  assert.match(dialogSource, /w-full.*sm:w-auto/);
  assert.match(dialogSource, /إغلاق/);
});

test("TA-100: Long email values retain LTR direction, wrapping, and an accessible full value", () => {
  assert.match(dialogSource, /dir="ltr"/);
  assert.match(dialogSource, /title=\{user\.email\}/);
  assert.match(dialogSource, /aria-label=\{`البريد الإلكتروني: \$\{user\.email\}`\}/);
  assert.match(dialogSource, /min-w-0 break-all text-left font-mono/);
});

test("TA-100: Native dialog focus and Escape behavior remain intact with restoration to account control", () => {
  assert.match(source, /profileCloseButtonRef\.current\?\.focus\(\)/);
  assert.match(source, /accountButtonRef\.current\?\.focus\(\)/);
  assert.match(source, /ref=\{accountButtonRef\}[\s\S]{0,400}aria-label=\{`قائمة الحساب:/);
  assert.match(dialogSource, /onCancel=\{\(event\) => \{/);
  assert.match(dialogSource, /event\.preventDefault\(\);\s*setProfileDialogOpen\(false\)/);
});
