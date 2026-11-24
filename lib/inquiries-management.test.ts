import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  normalizeInternationalPhone,
  parseSubmissionFilters,
  submissionChanges,
  submissionStatusLabels,
  whatsappUrl,
} from "@/lib/submissions";

test("TA-72: inquiry status filters and sorting use the documented server contract", () => {
  assert.equal(submissionStatusLabels.RESOLVED, "تمت المعالجة");
  assert.deepEqual(
    parseSubmissionFilters("inquiries", {
      page: "2",
      limit: "12",
      status: "CLOSED",
      sort: "oldest",
      applicationType: "UNIVERSITY_ADMISSION",
      search: "unsupported",
    }),
    { page: 2, limit: 12, status: "CLOSED", sort: "oldest" },
  );
});

test("TA-72: international contact actions never guess country codes", () => {
  assert.equal(normalizeInternationalPhone("+963 900-000-000"), "+963900000000");
  assert.equal(whatsappUrl("+963 900-000-000"), "https://wa.me/963900000000");
  assert.equal(normalizeInternationalPhone("00963900000000"), null);
  assert.equal(normalizeInternationalPhone("0900000000"), null);
  assert.equal(whatsappUrl(null), null);
});

test("TA-72: inquiry PATCH preserves a failed edit and clears notes only by explicit null", () => {
  const baseline = { status: "IN_REVIEW" as const, internalNote: "ملاحظة سابقة" };
  assert.deepEqual(submissionChanges(baseline, "IN_REVIEW", "تعديل غير محفوظ"), {
    internalNote: "تعديل غير محفوظ",
  });
  assert.deepEqual(submissionChanges(baseline, "IN_REVIEW", null), { internalNote: null });
});

test("TA-72: shared inquiry UI uses fixed server pagination, five-card batches and safe contact actions", async () => {
  const list = await readFile("components/submissions/submission-list-page.tsx", "utf8");
  const detail = await readFile("components/submissions/submission-detail-page.tsx", "utf8");
  const route = await readFile("app/admin/inquiries/[id]/page.tsx", "utf8");
  assert.match(list, /\(\) => \(\{ \.\.\.parsedFilters, limit: 12 \}\)/);
  assert.match(list, /useInfiniteSubmissionList\([\s\S]*?\n\s*5,/);
  assert.match(list, /new IntersectionObserver/);
  assert.doesNotMatch(list, /name="limit"/);
  assert.match(detail, /فتح واتساب/);
  assert.match(detail, /mailto:/);
  assert.match(detail, /ملاحظة خاصة بفريق الإدارة، ولا تظهر للمستفسر/);
  assert.match(route, /parseSubmissionFilters\("inquiries"/);
});
