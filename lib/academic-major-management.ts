import type { AcademicMajor } from "@/lib/api-client/university-management";
import { majorInputSchema, majorPatchSchema, type MajorInput, type MajorPatch } from "@/lib/university-schemas";

export type AcademicMajorFormValues = {
  nameAr: string;
  nameEn: string;
};

export const emptyAcademicMajorFormValues: AcademicMajorFormValues = {
  nameAr: "",
  nameEn: "",
};

/** The documented API requires an ASCII slug; it is derived internally and never shown as a normal form field. */
export function academicMajorSlugFromEnglishName(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function normalizeArabicMajorName(value: string): string {
  return value.trim();
}

export function normalizeEnglishMajorName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function academicMajorFormErrors(values: AcademicMajorFormValues): Record<keyof AcademicMajorFormValues, string | undefined> {
  const errors: Record<keyof AcademicMajorFormValues, string | undefined> = { nameAr: undefined, nameEn: undefined };
  if (!normalizeArabicMajorName(values.nameAr)) errors.nameAr = "اسم التخصص بالعربية مطلوب.";
  if (!normalizeEnglishMajorName(values.nameEn)) errors.nameEn = "اسم التخصص بالإنجليزية مطلوب.";
  if (!errors.nameEn && academicMajorSlugFromEnglishName(values.nameEn).length < 2) {
    errors.nameEn = "استخدم اسمًا إنجليزيًا يمكن تحويله إلى معرّف صالح من حرفين على الأقل.";
  }
  return errors;
}

export function findAcademicMajorDuplicates(
  majors: readonly AcademicMajor[],
  values: AcademicMajorFormValues,
  currentMajorId?: string,
): Partial<Record<keyof AcademicMajorFormValues, string>> {
  const others = majors.filter((major) => major.id !== currentMajorId);
  const errors: Partial<Record<keyof AcademicMajorFormValues, string>> = {};
  if (others.some((major) => normalizeArabicMajorName(major.nameAr) === normalizeArabicMajorName(values.nameAr))) {
    errors.nameAr = "هذا التخصص موجود مسبقاً.";
  }
  if (others.some((major) => normalizeEnglishMajorName(major.nameEn) === normalizeEnglishMajorName(values.nameEn))) {
    errors.nameEn = "هذا التخصص موجود مسبقاً.";
  }
  return errors;
}

export function academicMajorCreatePayload(values: AcademicMajorFormValues): MajorInput {
  return majorInputSchema.parse({
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    slug: academicMajorSlugFromEnglishName(values.nameEn),
  });
}

/** Name-only edits deliberately omit slug and category, preserving stable catalog identities and historical metadata. */
export function academicMajorPatchPayload(values: AcademicMajorFormValues, original: AcademicMajor): MajorPatch {
  const patch: MajorPatch = {};
  if (values.nameAr.trim() !== original.nameAr) patch.nameAr = values.nameAr.trim();
  if (values.nameEn.trim() !== original.nameEn) patch.nameEn = values.nameEn.trim();
  return majorPatchSchema.parse(patch);
}
