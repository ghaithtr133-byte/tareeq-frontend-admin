import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  auditActionLabel,
  auditResourceLabel,
  auditResourceTypeLabels,
  defaultScholarshipFundingTypes,
  defaultScholarshipStudyLevels,
  granularityLabels,
  managedRoleLabels,
  studyLevelLabel,
} from "@/lib/content-labels";
import { faqFormPayload, faqFormValues } from "@/lib/faq-form";
import { submissionChanges } from "@/lib/submissions";
import { settingsChanges, settingsValues, type SiteSettings } from "@/lib/site-settings-schemas";
import { aboutChanges, missingAboutPublicationFields, type AboutUsAdmin } from "@/lib/about-schemas";
import { formatRate, safeAnalyticsPath, safeAuditMetadata } from "@/lib/phase4-presentation";
import { auditResourceTypes, granularities, managedRoles } from "@/lib/phase4-schemas";

test("scholarship options modal does not use localStorage as shared catalog storage", () => {
  const modalPath = path.join(process.cwd(), "components", "content", "scholarship-options-modal.tsx");
  const source = fs.readFileSync(modalPath, "utf8");
  assert.equal(source.includes("localStorage.getItem"), false);
  assert.equal(source.includes("localStorage.setItem"), false);
  assert.equal(source.includes("localStorage.removeItem"), false);
  assert.ok(defaultScholarshipStudyLevels.length >= 5);
  assert.ok(defaultScholarshipFundingTypes.length >= 4);
});

test("submissionChanges sends changed fields only and supports explicit null note clear", () => {
  const baseline = { status: "NEW" as const, internalNote: "ملاحظة قديمة" };
  assert.deepEqual(submissionChanges(baseline, "NEW", "ملاحظة قديمة"), {});
  assert.deepEqual(submissionChanges(baseline, "IN_REVIEW", null), {
    status: "IN_REVIEW",
    internalNote: null,
  });
  assert.equal(studyLevelLabel("MASTERS"), "ماجستير");
});

test("settingsChanges requires explicit null clearing and omits unchanged values", () => {
  const record: SiteSettings = {
    academyNameAr: "أكاديمية طريق",
    academyNameEn: "Tareeq Academy",
    contactEmail: "info@tareeq.example",
    contactPhone: "+905550001122",
    addressAr: "إسطنبول",
    addressEn: null,
    facebookUrl: null,
    instagramUrl: null,
    linkedinUrl: null,
    youtubeUrl: null,
    updatedAt: "2026-03-01T10:00:00.000Z",
  };
  const values = settingsValues(record);
  values.academyNameAr = "أكاديمية طريق الدولية";
  const patch = settingsChanges(record, values, ["contactPhone"]);
  assert.deepEqual(patch, {
    academyNameAr: "أكاديمية طريق الدولية",
    contactPhone: null,
  });
});

test("aboutChanges preserves stored optional English fields and validates publish readiness", () => {
  const baseline: AboutUsAdmin = {
    id: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
    heroTitleAr: "من نحن",
    heroTitleEn: "About Us",
    heroSubtitleAr: "رؤيتنا التعليمية",
    heroSubtitleEn: null,
    introTitleAr: "مرحبا بكم",
    introTitleEn: null,
    introBodyAr: "نص تعريفي كامل بالعربية",
    introBodyEn: "Stored English intro",
    introImageUrl: null,
    introImageAltAr: null,
    introImageAltEn: null,
    missionTitleAr: null,
    missionTitleEn: null,
    missionBodyAr: null,
    missionBodyEn: null,
    visionTitleAr: null,
    visionTitleEn: null,
    visionBodyAr: null,
    visionBodyEn: null,
    ctaTitleAr: null,
    ctaTitleEn: null,
    ctaDescriptionAr: null,
    ctaDescriptionEn: null,
    ctaButtonLabelAr: null,
    ctaButtonLabelEn: null,
    seoTitleAr: null,
    seoDescriptionAr: null,
    status: "DRAFT",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    publishedAt: null,
    heroImageUrl: null,
    heroImageAltAr: null,
    heroImageAltEn: null,
  };

  assert.deepEqual(missingAboutPublicationFields(baseline, { status: "PUBLISHED" }), []);
  assert.deepEqual(
    missingAboutPublicationFields(baseline, { status: "PUBLISHED", heroTitleAr: null }),
    ["heroTitleAr"],
  );

  const patch = aboutChanges(baseline, { missionTitleAr: "رسالتنا" });
  assert.deepEqual(patch, { missionTitleAr: "رسالتنا" });
  assert.equal("introBodyEn" in patch, false);
});

test("faqFormPayload targets explicit group and omits optional English unless edited or cleared", () => {
  const group = { scope: "UNIVERSITY" as const, parentId: "d6465d5f-5d39-4bd1-ac2a-2d5eae2b3252" };
  const values = faqFormValues(undefined);
  values.questionAr = "ما شروط القبول؟";
  values.answerAr = "تختلف الشروط حسب التخصص.";
  const payload = faqFormPayload(group, values);
  assert.deepEqual(payload, {
    scope: "UNIVERSITY",
    parentId: "d6465d5f-5d39-4bd1-ac2a-2d5eae2b3252",
    questionAr: "ما شروط القبول؟",
    answerAr: "تختلف الشروط حسب التخصص.",
    status: "DRAFT",
  });
});

test("Phase 3/4 Arabic presentation labels cover all schema enums and safety guards", () => {
  for (const resourceType of auditResourceTypes) {
    assert.ok(auditResourceTypeLabels[resourceType], `Missing label for ${resourceType}`);
    assert.notEqual(auditResourceLabel(resourceType), "");
  }
  for (const g of granularities) {
    assert.ok(granularityLabels[g]);
  }
  for (const r of managedRoles) {
    assert.ok(managedRoleLabels[r]);
  }
  assert.equal(auditActionLabel("admin.user.deactivated"), "إلغاء تفعيل حساب");
  assert.equal(auditActionLabel("content.country.created"), "إنشاء سجل");

  // Rate formatting must never multiply by 100
  assert.equal(formatRate(6.47), "6.47٪");
  // Safe analytics path blocks query strings & javascript URLs
  assert.equal(safeAnalyticsPath("/universities/istanbul"), "/universities/istanbul");
  assert.equal(safeAnalyticsPath("javascript:alert(1)"), "مسار محجوب لسلامة العرض");
  // Audit metadata allowlists safe fields and flags hidden fields
  const meta = safeAuditMetadata({ toStatus: "PUBLISHED", secretToken: "abc" });
  assert.equal(meta.rows.length, 1);
  assert.equal(meta.hasHiddenFields, true);
});

test("SUPER_ADMIN boundary wraps both settings and about routes", () => {
  const settingsRoute = fs.readFileSync(path.join(process.cwd(), "app/admin/settings/page.tsx"), "utf8");
  const aboutRoute = fs.readFileSync(path.join(process.cwd(), "app/admin/about/page.tsx"), "utf8");
  assert.ok(settingsRoute.includes("SuperAdminBoundary"));
  assert.ok(aboutRoute.includes("SuperAdminBoundary"));
});

