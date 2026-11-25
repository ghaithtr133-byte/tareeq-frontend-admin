import { z } from "zod";
import { isoDateSchema, publicationStates, uuidSchema } from "@/lib/university-schemas";

export const aboutSections = [
  { title: "النص الافتتاحي", fields: [["heroTitleAr", "العنوان بالعربية", 200], ["heroTitleEn", "العنوان بالإنجليزية", 200], ["heroSubtitleAr", "العنوان الفرعي بالعربية", 1000, "textarea"], ["heroSubtitleEn", "العنوان الفرعي بالإنجليزية", 1000, "textarea"]] },
  { title: "المقدمة", image: true, fields: [["introTitleAr", "عنوان المقدمة بالعربية", 200], ["introTitleEn", "عنوان المقدمة بالإنجليزية", 200], ["introBodyAr", "نص المقدمة بالعربية", 12000, "textarea"], ["introBodyEn", "نص المقدمة بالإنجليزية", 12000, "textarea"], ["introImageUrl", "رابط صورة المقدمة", 2048, "url"], ["introImageAltAr", "النص البديل لصورة المقدمة بالعربية", 500], ["introImageAltEn", "النص البديل لصورة المقدمة بالإنجليزية", 500]] },
  { title: "الرسالة", fields: [["missionTitleAr", "عنوان الرسالة بالعربية", 200], ["missionTitleEn", "عنوان الرسالة بالإنجليزية", 200], ["missionBodyAr", "نص الرسالة بالعربية", 6000, "textarea"], ["missionBodyEn", "نص الرسالة بالإنجليزية", 6000, "textarea"]] },
  { title: "الرؤية", fields: [["visionTitleAr", "عنوان الرؤية بالعربية", 200], ["visionTitleEn", "عنوان الرؤية بالإنجليزية", 200], ["visionBodyAr", "نص الرؤية بالعربية", 6000, "textarea"], ["visionBodyEn", "نص الرؤية بالإنجليزية", 6000, "textarea"]] },
  { title: "الدعوة للإجراء — النص", fields: [["ctaTitleAr", "عنوان الدعوة بالعربية", 200], ["ctaTitleEn", "عنوان الدعوة بالإنجليزية", 200], ["ctaDescriptionAr", "وصف الدعوة بالعربية", 2000, "textarea"], ["ctaDescriptionEn", "وصف الدعوة بالإنجليزية", 2000, "textarea"], ["ctaButtonLabelAr", "نص الزر بالعربية", 120], ["ctaButtonLabelEn", "نص الزر بالإنجليزية", 120]] },
  { title: "تحسين محركات البحث", fields: [["seoTitleAr", "عنوان SEO بالعربية", 200], ["seoDescriptionAr", "وصف SEO بالعربية", 320, "textarea"]] },
] as const;

export type AboutField = (typeof aboutSections)[number]["fields"][number][0];
export const aboutFields = aboutSections.flatMap<(typeof aboutSections)[number]["fields"][number]>(({ fields }) => [...fields]);
const responseFields = Object.fromEntries(aboutFields.map(([name]) => [name, z.string().nullable()])) as Record<AboutField, z.ZodNullable<z.ZodString>>;
const editorFields = Object.fromEntries(aboutFields.map(([name, , max, kind]) => {
  const field = z.string().min(1, "أدخل نصًا أو استخدم المسح الصريح.").max(max, `الحد الأقصى ${max} حرفًا.`);
  return [name, (kind === "url" ? field.refine(value => z.url().safeParse(value).success, "أدخل رابطًا صالحًا.") : field).nullable()];
})) as Record<AboutField, z.ZodNullable<z.ZodString>>;

export const aboutAdminSchema = z.object({
  ...responseFields,
  id: uuidSchema, status: z.enum(publicationStates), createdAt: isoDateSchema, updatedAt: isoDateSchema, publishedAt: isoDateSchema.nullable(),
  introImageUrl: z.url().nullable(), heroImageUrl: z.url().nullable(), heroImageAltAr: z.string().nullable(), heroImageAltEn: z.string().nullable(),
});

// Intentionally narrower than the wire schema: fixed Hero imagery and timestamps are not editable.
export const aboutUpdateSchema = z.strictObject({ ...editorFields, status: z.enum(publicationStates) }).partial().refine(value => Object.values(value).some(field => field !== undefined), "لا توجد تغييرات للحفظ.");
export type AboutUsAdmin = z.infer<typeof aboutAdminSchema>;
export type AboutUsUpdateRequest = z.infer<typeof aboutUpdateSchema>;

export const aboutPublicationFields = ["heroTitleAr", "heroSubtitleAr", "introTitleAr", "introBodyAr"] as const;
export function aboutChanges(baseline: AboutUsAdmin | null, edits: AboutUsUpdateRequest): AboutUsUpdateRequest {
  const changes: AboutUsUpdateRequest = {};
  for (const [field] of aboutFields) {
    const edit = edits[field]; const original = baseline?.[field] ?? null;
    if (edit !== undefined && edit !== original && !(edit === "" && original === null)) changes[field] = edit;
  }
  if (edits.status && edits.status !== baseline?.status) changes.status = edits.status;
  else if (!baseline) changes.status = "DRAFT";
  return changes;
}

export function missingAboutPublicationFields(baseline: AboutUsAdmin | null, changes: AboutUsUpdateRequest) {
  if ((changes.status ?? baseline?.status) !== "PUBLISHED") return [];
  return aboutPublicationFields.filter(field => !(changes[field] === undefined ? baseline?.[field] : changes[field])?.trim());
}
