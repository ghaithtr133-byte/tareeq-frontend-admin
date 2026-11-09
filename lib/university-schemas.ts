import { z } from "zod";

export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "اختر معرّفًا صالحًا.");
export const programStudyLevels = ["FOUNDATION", "DIPLOMA", "BACHELORS", "MASTERS", "PHD"] as const;
export const teachingLanguages = ["ARABIC", "ENGLISH", "FRENCH", "GERMAN", "TURKISH", "ROMANIAN", "RUSSIAN", "SPANISH", "ITALIAN"] as const;
export const publicationStates = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const admissionScopes = ["UNIVERSITY", "STUDY_LEVEL", "PROGRAM"] as const;
export type ProgramStudyLevel = typeof programStudyLevels[number];
export type TeachingLanguage = typeof teachingLanguages[number];
export type UniversityType = "PUBLIC" | "PRIVATE";
export const slugSchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = (max: number) => z.string().trim().min(1).max(max);
export const isoDateSchema = z.iso.datetime({ offset: true });
const sourceSchema = z.url().max(2048);
const publication = z.enum(publicationStates);

export const majorInputSchema = z.object({ slug: slugSchema, nameAr: text(200), nameEn: text(200), category: text(120).nullable().optional() }).strict();
export const cityInputSchema = z.object({ countryId: uuidSchema, slug: slugSchema, nameAr: text(200), nameEn: text(200) }).strict();
export const tuitionInputSchema = z.object({
  amount: z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  billingPeriod: z.enum(["YEAR", "SEMESTER", "FULL_PROGRAM"]),
  // The export specifies this pattern only; no consecutive-year rule is invented.
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/),
}).strict();
export const tuitionRecordSchema = tuitionInputSchema.extend({
  id: uuidSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
const programFields = {
  academicMajorId: uuidSchema, nameAr: text(300), nameEn: text(300).nullable().optional(),
  facultyNameAr: text(300).nullable().optional(), facultyNameEn: text(300).nullable().optional(),
  durationValue: z.number().int().min(1).max(240).nullable().optional(),
  durationUnit: z.enum(["MONTHS", "YEARS"]).nullable().optional(),
  studyLevel: z.enum(programStudyLevels), languages: z.array(z.enum(teachingLanguages)).min(1).max(9),
  status: publication.optional(), officialSourceUrl: sourceSchema, verifiedAt: isoDateSchema,
  tuition: tuitionInputSchema.optional(),
};
const programCreateBase = z.object(programFields).strict();
export const programCreateSchema = programCreateBase.superRefine((data, ctx) => {
  if ((data.durationValue != null) !== (data.durationUnit != null)) ctx.addIssue({ code: "custom", path: ["durationValue"], message: "أدخل قيمة المدة ووحدتها معًا أو امسحهما معًا." });
});
export const programPatchSchema = programCreateBase.partial().superRefine((data, ctx) => {
  if (!Object.keys(data).length) ctx.addIssue({ code: "custom", message: "لا توجد تغييرات للحفظ." });
  if (("durationValue" in data || "durationUnit" in data) && (data.durationValue != null) !== (data.durationUnit != null)) ctx.addIssue({ code: "custom", path: ["durationValue"], message: "أرسل حقلي المدة معًا." });
});
const requirementFields = {
  scope: z.enum(admissionScopes), studyLevel: z.enum(programStudyLevels).nullable().optional(), programId: uuidSchema.nullable().optional(),
  contentAr: text(20000), contentEn: text(20000).nullable().optional(), status: publication.optional(),
  officialSourceUrl: sourceSchema.nullable().optional(), verifiedAt: isoDateSchema.nullable().optional(),
};
export const requirementCreateSchema = z.object(requirementFields).strict().superRefine((data, ctx) => {
  if (data.scope === "STUDY_LEVEL" && (!data.studyLevel || data.programId)) ctx.addIssue({ code: "custom", path: ["studyLevel"], message: "اختر المستوى الدراسي فقط لهذا النطاق." });
  if (data.scope === "PROGRAM" && (!data.programId || data.studyLevel)) ctx.addIssue({ code: "custom", path: ["programId"], message: "اختر برنامجًا من هذه الجامعة فقط." });
  if (data.scope === "UNIVERSITY" && (data.studyLevel || data.programId)) ctx.addIssue({ code: "custom", path: ["scope"], message: "متطلبات الجامعة لا تستهدف مستوى أو برنامجًا." });
  if (data.status === "PUBLISHED" && (!data.officialSourceUrl?.startsWith("https://") || !data.verifiedAt || Date.parse(data.verifiedAt) > Date.now())) ctx.addIssue({ code: "custom", path: ["verifiedAt"], message: "النشر يتطلب مصدر HTTPS رسميًا وتاريخ تحقق غير مستقبلي." });
});
export const requirementPatchSchema = z.object({ contentAr: requirementFields.contentAr.optional(), contentEn: requirementFields.contentEn, status: requirementFields.status, officialSourceUrl: requirementFields.officialSourceUrl, verifiedAt: requirementFields.verifiedAt }).strict().refine((data) => Object.keys(data).length > 0, "لا توجد تغييرات للحفظ.");
export const galleryInputSchema = z.object({ imageUrl: sourceSchema, altAr: text(500).nullable().optional(), altEn: text(500).nullable().optional(), status: publication.optional() }).strict();
export const galleryPatchSchema = galleryInputSchema.partial().refine((data) => Object.keys(data).length > 0, "لا توجد تغييرات للحفظ.");
export const galleryOrderSchema = z.object({ orderedIds: z.array(uuidSchema).max(100).refine((ids) => new Set(ids).size === ids.length, "لا تكرر الصور في الترتيب.") }).strict();

export type MajorInput = z.infer<typeof majorInputSchema>;
export type CityInput = z.infer<typeof cityInputSchema>;
export type ProgramInput = z.infer<typeof programCreateSchema>;
export type RequirementInput = z.infer<typeof requirementCreateSchema>;
export type GalleryInput = z.infer<typeof galleryInputSchema>;

/** Form dates use the local timezone; requests always use ISO timestamps. */
export function localDateValue(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function isoFormDate(value: string): string | null { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; }
