import { z } from "zod";
import { isoDateSchema } from "@/lib/university-schemas";

export const settingsFields = [
  { name: "academyNameAr", label: "اسم الأكاديمية بالعربية", group: "identity", max: 200, kind: "text" },
  { name: "academyNameEn", label: "اسم الأكاديمية بالإنجليزية", group: "identity", max: 200, kind: "text" },
  { name: "contactEmail", label: "البريد الإلكتروني للتواصل", group: "contact", max: 254, kind: "email" },
  { name: "contactPhone", label: "هاتف التواصل", group: "contact", max: 25, kind: "tel" },
  { name: "addressAr", label: "العنوان بالعربية", group: "contact", max: 1000, kind: "textarea" },
  { name: "addressEn", label: "العنوان بالإنجليزية", group: "contact", max: 1000, kind: "textarea" },
  { name: "facebookUrl", label: "رابط Facebook", group: "social", max: 2048, kind: "url" },
  { name: "instagramUrl", label: "رابط Instagram", group: "social", max: 2048, kind: "url" },
  { name: "linkedinUrl", label: "رابط LinkedIn", group: "social", max: 2048, kind: "url" },
  { name: "youtubeUrl", label: "رابط YouTube", group: "social", max: 2048, kind: "url" },
] as const;
export type SettingsFieldName = typeof settingsFields[number]["name"];
const nullableText = z.string().nullable();
export const siteSettingsSchema = z.object({ academyNameAr: nullableText, academyNameEn: nullableText, contactEmail: z.email().nullable(), contactPhone: nullableText, addressAr: nullableText, addressEn: nullableText, facebookUrl: z.url().nullable(), instagramUrl: z.url().nullable(), linkedinUrl: z.url().nullable(), youtubeUrl: z.url().nullable(), updatedAt: isoDateSchema.nullable() });
export const siteSettingsUpdateSchema = z.object({ academyNameAr: z.string().min(1).max(200).nullable().optional(), academyNameEn: z.string().min(1).max(200).nullable().optional(), contactEmail: z.string().max(254).nullable().optional(), contactPhone: z.string().min(7).max(25).regex(/^\+?[0-9][0-9 ()-]{5,23}[0-9]$/).nullable().optional(), addressAr: z.string().min(1).max(1000).nullable().optional(), addressEn: z.string().min(1).max(1000).nullable().optional(), facebookUrl: z.url().max(2048).nullable().optional(), instagramUrl: z.url().max(2048).nullable().optional(), linkedinUrl: z.url().max(2048).nullable().optional(), youtubeUrl: z.url().max(2048).nullable().optional() }).strict().refine(value => Object.keys(value).length > 0, "لا توجد تغييرات للحفظ.");
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SiteSettingsUpdate = z.infer<typeof siteSettingsUpdateSchema>;
export type SettingsValues = Record<SettingsFieldName, string>;
export function settingsValues(record: SiteSettings): SettingsValues { return Object.fromEntries(settingsFields.map(field => [field.name, record[field.name] ?? ""])) as SettingsValues; }
/** Clearing is explicit. A blank input never silently becomes null. */
export function settingsChanges(record: SiteSettings, values: SettingsValues, cleared: readonly SettingsFieldName[]): SiteSettingsUpdate {
  const output: SiteSettingsUpdate = {};
  for (const { name } of settingsFields) {
    if (cleared.includes(name)) { if (record[name] !== null) output[name] = null; }
    else if (values[name] !== (record[name] ?? "")) output[name] = values[name];
  }
  return siteSettingsUpdateSchema.parse(output);
}
