import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { auditActionTitle, safeAuditMetadata } from "@/lib/phase4-presentation";
import { auditParamsSchema } from "@/lib/phase4-schemas";

test("TA-70: Audit action/resource labels and unknown actions are truthful", () => {
  assert.equal(auditActionTitle("content.country.created", "COUNTRY"), "إنشاء دولة");
  assert.equal(auditActionTitle("content.country.updated", "COUNTRY"), "تعديل دولة");
  assert.equal(auditActionTitle("content.country.status_changed", "COUNTRY"), "تغيير حالة دولة");
  assert.equal(auditActionTitle("unexpected.action", "COUNTRY"), "إجراء إداري غير معروف");
});

test("TA-70: Audit filters accept only documented values and preserve a fixed server limit", () => {
  assert.deepEqual(auditParamsSchema.parse({ page: 2, limit: 20, action: "content.country.updated", resourceType: "COUNTRY" }), {
    page: 2, limit: 20, action: "content.country.updated", resourceType: "COUNTRY",
  });
  for (const input of [
    { resourceId: "22222222-2222-4222-8222-222222222222" },
    { action: "Arabic label" },
    { from: "2026-11-02T00:00:00Z", to: "2026-11-01T00:00:00Z" },
  ]) assert.equal(auditParamsSchema.safeParse(input).success, false);
});

test("TA-70: Audit metadata redacts secrets and keeps previous/new statuses in order", () => {
  const view = safeAuditMetadata({ fromStatus: "PUBLISHED", toStatus: "DRAFT", password: "secret", nested: { token: "secret" } });
  assert.deepEqual(view.transitions, [{ label: "تغيير الحالة", from: "منشور", to: "مسودة" }]);
  assert.equal(JSON.stringify(view).includes("secret"), false);
  assert.equal(view.hasHiddenFields, true);
});

test("TA-70: Audit UI uses immediate valid filters, advanced exact codes, expandable safe details and no mutations", async () => {
  const source = await readFile("components/phase4/audit-page.tsx", "utf8");
  assert.match(source, /limit: 20/);
  assert.match(source, /مرشحات متقدمة/);
  assert.match(source, /رمز العملية الدقيق/);
  assert.match(source, /عرض التفاصيل/);
  assert.match(source, /safeAuditMetadata/);
  assert.match(source, /setTimeout/);
  assert.doesNotMatch(source, /تطبيق مرشحات السجل|سجلات لكل صفحة|<form/);
  assert.doesNotMatch(source, /mutation|PATCH|DELETE/);
});
