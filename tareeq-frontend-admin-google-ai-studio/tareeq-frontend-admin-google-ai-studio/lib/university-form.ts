import type { SectionRecords, UniversitySection } from "@/lib/api-client/university-management";
import { galleryInputSchema, galleryPatchSchema, isoFormDate, localDateValue, programCreateSchema, programPatchSchema, requirementCreateSchema, requirementPatchSchema } from "@/lib/university-schemas";

export type ManagementValues = Record<string, string>;
export function sectionValues(section: UniversitySection, record?: SectionRecords[UniversitySection]): ManagementValues {
  const values: ManagementValues = { status: "DRAFT", scope: "UNIVERSITY", studyLevel: "BACHELORS", durationUnit: "", billingPeriod: "YEAR", currency: "USD", languages: "ENGLISH" };
  if (record) for (const [name, value] of Object.entries(record)) {
    if (typeof value === "string" || typeof value === "number") values[name] = String(value);
    else if (name === "languages" && Array.isArray(value)) values[name] = value.join(",");
    else if (value === null) values[name] = "";
  }
  values.verifiedAt = localDateValue(record && "verifiedAt" in record ? record.verifiedAt : undefined);
  // Only opt-in input for one year; response history is never copied into a write.
  values.includeTuition = "";
  if (section === "admission-requirements" && !record) values.studyLevel = "";
  return values;
}
export function sectionPayload(section: UniversitySection, values: ManagementValues, record?: SectionRecords[UniversitySection]) {
  const nullable = (name: string) => values[name]?.trim() || null;
  let input: Record<string, unknown>;
  if (section === "programs") input = {
    academicMajorId: values.academicMajorId, nameAr: values.nameAr?.trim(), nameEn: nullable("nameEn"), facultyNameAr: nullable("facultyNameAr"), facultyNameEn: nullable("facultyNameEn"), durationValue: values.durationValue ? Number(values.durationValue) : null, durationUnit: nullable("durationUnit"), studyLevel: values.studyLevel, languages: values.languages?.split(",").filter(Boolean) ?? [], status: values.status, officialSourceUrl: values.officialSourceUrl?.trim(), verifiedAt: isoFormDate(values.verifiedAt),
    ...(values.includeTuition === "yes" ? { tuition: { amount: values.amount, currency: values.currency, billingPeriod: values.billingPeriod, academicYear: values.academicYear } } : {}),
  };
  else if (section === "admission-requirements") {
    input = { contentAr: values.contentAr?.trim(), contentEn: nullable("contentEn"), status: values.status, officialSourceUrl: nullable("officialSourceUrl"), verifiedAt: isoFormDate(values.verifiedAt) };
    if (!record) Object.assign(input, {
      scope: values.scope,
      studyLevel: values.scope === "STUDY_LEVEL" ? nullable("studyLevel") : null,
      ...(values.scope === "PROGRAM" ? { programId: values.programId } : {}),
    });
    if (input.status === "PUBLISHED" && (typeof input.officialSourceUrl !== "string" || !input.officialSourceUrl.startsWith("https://") || typeof input.verifiedAt !== "string" || Date.parse(input.verifiedAt) > Date.now())) throw new Error("النشر يتطلب مصدر HTTPS وتاريخ تحقق غير مستقبلي.");
  } else input = { imageUrl: values.imageUrl?.trim(), altAr: nullable("altAr"), altEn: nullable("altEn"), status: values.status };
  if (record) {
    const original = sectionValues(section, record);
    // Compare normalized form dates, not second precision that datetime-local cannot display.
    for (const key of Object.keys(input)) {
      if (key === "tuition") continue;
      if ((original[key] ?? "") === (values[key] ?? "")) delete input[key];
    }
    if (section === "programs" && ("durationValue" in input || "durationUnit" in input)) Object.assign(input, { durationValue: values.durationValue ? Number(values.durationValue) : null, durationUnit: nullable("durationUnit") });
  }
  return (section === "programs" ? record ? programPatchSchema : programCreateSchema : section === "gallery" ? record ? galleryPatchSchema : galleryInputSchema : record ? requirementPatchSchema : requirementCreateSchema).parse(input);
}
