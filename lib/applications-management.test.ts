import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applicationTypeLabels,
  parseSubmissionFilters,
  submissionChanges,
  submissionStatusLabels,
} from "@/lib/submissions";

test("TA-71: Applications labels and server filter allowlist match the contract", () => {
  assert.equal(applicationTypeLabels.UNIVERSITY_ADMISSION, "قبول جامعي");
  assert.equal(applicationTypeLabels.SCHOLARSHIP_ASSISTANCE, "مساعدة في منحة دراسية");
  assert.deepEqual(submissionStatusLabels, {
    NEW: "جديد",
    IN_REVIEW: "قيد المراجعة",
    RESOLVED: "تمت المعالجة",
    CLOSED: "مغلق",
  });
  assert.deepEqual(
    parseSubmissionFilters("applications", {
      page: "3",
      limit: "12",
      status: "IN_REVIEW",
      sort: "updated",
      applicationType: "SCHOLARSHIP_ASSISTANCE",
      search: "must-not-be-forwarded",
    }),
    {
      page: 3,
      limit: 12,
      status: "IN_REVIEW",
      sort: "updated",
      applicationType: "SCHOLARSHIP_ASSISTANCE",
    },
  );
});

test("TA-71: status/note PATCH is partial and an intentional clear remains null", () => {
  const baseline = { status: "NEW" as const, internalNote: "ملاحظة قائمة" };
  assert.deepEqual(submissionChanges(baseline, "NEW", "ملاحظة قائمة"), {});
  assert.deepEqual(submissionChanges(baseline, "IN_REVIEW", "ملاحظة قائمة"), {
    status: "IN_REVIEW",
  });
  assert.deepEqual(submissionChanges(baseline, "NEW", null), { internalNote: null });
});

test("TA-71: Applications list keeps fixed desktop pagination and mobile five-item server batches", async () => {
  const source = await readFile("components/submissions/submission-list-page.tsx", "utf8");
  const hook = await readFile("hook/queries/use-submission-queries.ts", "utf8");
  assert.match(source, /\(\) => \(\{ \.\.\.parsedFilters, limit: 12 \}\)/);
  assert.doesNotMatch(source, /name="limit"/);
  assert.match(source, /useInfiniteSubmissionList\([\s\S]*?\n\s*5,/);
  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /returnQuery/);
  assert.match(hook, /getNextPageParam/);
});

test("TA-71: Application detail protects submitted data and resolves relations without UUID UI", async () => {
  const source = await readFile("components/submissions/submission-detail-page.tsx", "utf8");
  assert.match(source, /function ApplicationRelation/);
  assert.match(source, /useContentDetail\(resource, id \?\? undefined\)/);
  assert.match(source, /function EmailDetail/);
  assert.match(source, /mailto:\$\{email\}/);
  assert.match(source, /beforeunload/);
  assert.doesNotMatch(source, /موافقة سياسة الخصوصية/);
  assert.doesNotMatch(source, /معرّف الدولة المرتبط|معرّف الجامعة المرتبطة|معرّف المنحة المرتبطة/);
});
