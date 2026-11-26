import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { AxiosError } from "axios";

import { contentErrorFieldName, contentSaveErrorMessage } from "@/lib/content-save-feedback";

function responseError(status: number, message: string, fields: Record<string, string[]> = {}) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    config: {} as never,
    status,
    statusText: "Request failed",
    headers: {},
    data: { success: false, error: { code: "VALIDATION_ERROR", message, details: { fields } } },
  });
}

test("TA-57: nested article block errors are attached to the unified editor", () => {
  assert.equal(contentErrorFieldName("bodyAr.1.text"), "bodyAr");
  assert.equal(contentErrorFieldName("bodyEn[0].text"), "bodyEn");
  assert.equal(contentErrorFieldName("titleAr"), "titleAr");
});

test("TA-57: documented save failures receive meaningful Arabic feedback", () => {
  const fieldError = responseError(400, "راجع محتوى المقال العربي", { "bodyAr.1.text": ["السطر الفارغ غير مقبول"] });
  assert.equal(contentSaveErrorMessage(fieldError, { bodyAr: ["السطر الفارغ غير مقبول"] }), "راجع محتوى المقال العربي");
  assert.match(contentSaveErrorMessage(responseError(403, "Forbidden"), {}), /صلاحية|التحقق الأمني/);
  assert.match(contentSaveErrorMessage(responseError(400, "Invalid", { bodyAr: ["Invalid"] }), { bodyAr: ["Invalid"] }), /الحقول/);
});

test("TA-57: shared content forms render save errors directly below desktop and mobile save actions", () => {
  const source = readFileSync("components/content/content-form-page.tsx", "utf8");
  assert.match(source, /Desktop Actions[\s\S]{0,2000}<SaveErrorMessage message=\{submitError\}/);
  assert.match(source, /Mobile Sticky Action Bar[\s\S]{0,2000}<SaveErrorMessage message=\{submitError\}/);
});
