import assert from "node:assert/strict";
import test from "node:test";

import {
  academicMajorCreatePayload,
  academicMajorFormErrors,
  academicMajorPatchPayload,
  academicMajorSlugFromEnglishName,
  findAcademicMajorDuplicates,
} from "@/lib/academic-major-management";
import { dates, major, majorId } from "@/tests/fixtures/university-management";

test("academic-major creation derives an internal valid slug from the English name", () => {
  assert.equal(academicMajorSlugFromEnglishName(" Computer Engineering "), "computer-engineering");
  assert.equal(academicMajorSlugFromEnglishName("Économie & Finance"), "economie-finance");
  assert.deepEqual(academicMajorCreatePayload({ nameAr: " هندسة الحاسوب ", nameEn: " Computer Engineering " }), {
    nameAr: "هندسة الحاسوب", nameEn: "Computer Engineering", slug: "computer-engineering",
  });
  assert.equal(academicMajorFormErrors({ nameAr: "هندسة", nameEn: "A" }).nameEn, "استخدم اسمًا إنجليزيًا يمكن تحويله إلى معرّف صالح من حرفين على الأقل.");
});

test("academic-major duplicate checks are global, independent by language, and exclude the record being edited", () => {
  const sameArabic = { ...major, nameAr: " علوم الحاسوب ", nameEn: "Different Major" };
  const sameEnglish = { ...major, id: "00000000-0000-4000-8000-000000000099", nameAr: "اسم مختلف", nameEn: "COMPUTER SCIENCE", ...dates };
  assert.deepEqual(findAcademicMajorDuplicates([sameArabic, sameEnglish], { nameAr: "علوم الحاسوب", nameEn: "computer science" }), {
    nameAr: "هذا التخصص موجود مسبقاً.", nameEn: "هذا التخصص موجود مسبقاً.",
  });
  assert.deepEqual(findAcademicMajorDuplicates([sameArabic], { nameAr: "علوم الحاسوب", nameEn: "Different Major" }, majorId), {});
});

test("academic-major PATCH preserves the saved slug and category and omits unchanged fields", () => {
  const record = { ...major, category: "Engineering" };
  assert.deepEqual(academicMajorPatchPayload({ nameAr: "علوم الحاسوب التطبيقية", nameEn: record.nameEn }, record), { nameAr: "علوم الحاسوب التطبيقية" });
  assert.throws(() => academicMajorPatchPayload({ nameAr: record.nameAr, nameEn: record.nameEn }, record));
});
