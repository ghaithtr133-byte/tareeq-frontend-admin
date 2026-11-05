import { z } from "zod";

import type { AdminContentResource, Article, ArticleRichTextBlock, ContentRecord, ContentTypeMap } from "@/api/content";
import { articleBlockOptions, contentDefinitions } from "@/lib/content-config";
import { uuidSchema } from "@/lib/university-schemas";

export type ContentFormValues = Record<string, string | boolean | ArticleRichTextBlock[] | string[] | undefined>;

const slugSchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const articleScholarshipIdsSchema = z.array(uuidSchema).max(50, "الحد الأقصى 50 منحة.").refine(ids => new Set(ids).size === ids.length, "لا تكرر المنحة المرتبطة.");
const urlSchema = z.string().url("أدخل رابطًا صالحًا.");
const articleBlockSchema = z.object({
  type: z.enum(articleBlockOptions.map((option) => option.value) as ["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote"]),
  text: z.string().trim().min(1, "أدخل نص الكتلة.").max(10000),
});

export function initialContentValues(resource: AdminContentResource, record?: ContentRecord): ContentFormValues {
  const values: ContentFormValues = { featured: false, status: "DRAFT" };
  for (const field of contentDefinitions[resource].fields) {
    const recordValue = record ? (record as unknown as Record<string, unknown>)[field.name] : undefined;
    if (field.kind === "scholarships") continue;
    if (field.kind === "checkbox") values[field.name] = typeof recordValue === "boolean" ? recordValue : false;
    else if (field.kind === "number") values[field.name] = recordValue === undefined || recordValue === null ? "0" : String(recordValue);
    else values[field.name] = field.kind === "datetime-local" ? toDateTimeLocal(recordValue) : recordValue === undefined || recordValue === null ? "" : String(recordValue);
  }
  if (resource === "scholarships" && !values.applicationStatus) values.applicationStatus = "OPEN";
  if (resource === "articles") {
    const article = record as Article | undefined;
    values.bodyAr = article?.bodyAr ?? [{ type: "paragraph", text: "" }];
    values.bodyEn = article?.bodyEn ?? [];
    values.scholarshipIds = [...(article?.scholarshipIds ?? (article?.scholarshipId ? [article.scholarshipId] : []))];
  }
  return values;
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function toDateTimeLocal(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "";
  const date = new Date(value);
  // datetime-local needs local wall time, including the original seconds/milliseconds.
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
}

export function validateContentValues(resource: AdminContentResource, values: ContentFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (resource === "universities") {
    if (String(values.slug ?? "").trim().length < 2) errors.slug = "المعرّف النصي حرفان على الأقل.";
    for (const name of ["countryId", "cityId"]) if (values[name] && !uuidSchema.safeParse(values[name]).success) errors[name] = "اختر معرّفًا صالحًا.";
    if (values.universityType && !["PUBLIC", "PRIVATE"].includes(String(values.universityType))) errors.universityType = "اختر نوعًا معتمدًا.";
  }
  for (const field of contentDefinitions[resource].fields) {
    const value = values[field.name];
    if (field.kind === "scholarships") continue;
    if (field.kind === "checkbox" || field.kind === "select" || field.kind === "country" || field.kind === "university" || field.kind === "scholarship") {
      if (field.required && isBlank(value)) errors[field.name] = "هذا الحقل مطلوب.";
      continue;
    }
    if (field.kind === "number") {
      if (!isBlank(value) && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 1000000)) errors[field.name] = "أدخل رقمًا صحيحًا بين 0 و1000000.";
      continue;
    }
    if (field.kind === "datetime-local" && !isBlank(value) && Number.isNaN(new Date(String(value)).getTime())) {
      errors[field.name] = "أدخل تاريخًا ووقتًا صالحين.";
      continue;
    }
    if (field.required && isBlank(value)) {
      errors[field.name] = "هذا الحقل مطلوب.";
      continue;
    }
    if (isBlank(value)) continue;
    const text = String(value).trim();
    if (field.maxLength && text.length > field.maxLength) errors[field.name] = `الحد الأقصى ${field.maxLength} حرفًا.`;
    if (field.name === "slug" && !slugSchema.safeParse(text).success) errors[field.name] = "أدخل معرّفًا من 2 إلى 120 حرفًا بأحرف إنجليزية صغيرة وأرقام وشرطات فقط.";
    if (field.kind === "url" && !urlSchema.safeParse(text).success) errors[field.name] = "أدخل رابطًا صالحًا.";
  }
  if (resource === "articles") {
    const associations = articleScholarshipIdsSchema.safeParse(values.scholarshipIds ?? []);
    if (!associations.success) errors.scholarshipIds = associations.error.issues[0]?.message ?? "تحقق من المنح المرتبطة.";
    const bodyAr = values.bodyAr ?? [];
    const parsedAr = z.array(articleBlockSchema).min(1, "أضف كتلة عربية واحدة على الأقل.").max(500).safeParse(bodyAr);
    if (!parsedAr.success) errors.bodyAr = parsedAr.error.issues[0]?.message ?? "تحقق من محتوى المقال العربي.";
    const bodyEn = Array.isArray(values.bodyEn) ? values.bodyEn : [];
    if (bodyEn.length) {
      const parsedEn = z.array(articleBlockSchema).min(1).max(500).safeParse(bodyEn);
      if (!parsedEn.success) errors.bodyEn = parsedEn.error.issues[0]?.message ?? "تحقق من محتوى المقال الإنجليزي.";
    }
  }
  return errors;
}

/** Converts UI blanks to omission, except for fields the published schema explicitly allows as null. */
export function toContentPayload<K extends AdminContentResource>(resource: K, values: ContentFormValues): ContentTypeMap[K]["input"] {
  const payload: Record<string, unknown> = {};
  for (const field of contentDefinitions[resource].fields) {
    const value = values[field.name];
    if (field.kind === "scholarships") continue;
    if (field.kind === "checkbox") {
      payload[field.name] = Boolean(value);
      continue;
    }
    if (field.kind === "number") {
      payload[field.name] = Number(value || "0");
      continue;
    }
    if (isBlank(value)) {
      if (field.nullable) payload[field.name] = null;
      continue;
    }
    payload[field.name] = field.kind === "datetime-local" ? new Date(String(value)).toISOString() : String(value).trim();
  }
  if (resource === "articles") {
    if (values.scholarshipIds !== undefined) payload.scholarshipIds = articleScholarshipIdsSchema.parse(values.scholarshipIds);
    else if (values.scholarshipId !== undefined) payload.scholarshipId = isBlank(values.scholarshipId) ? null : values.scholarshipId;
    payload.bodyAr = values.bodyAr ?? [];
    payload.bodyEn = Array.isArray(values.bodyEn) && values.bodyEn.length ? values.bodyEn : null;
  }
  return payload as ContentTypeMap[K]["input"];
}

/** Core edit semantics: unchanged fields omitted, explicit documented null/[] clears retained. */
export function toContentPatch<K extends AdminContentResource>(resource: K, values: ContentFormValues, record: ContentRecord): ContentTypeMap[K]["input"] {
  const next = toContentPayload(resource, values) as Record<string, unknown>;
  const before = toContentPayload(resource, initialContentValues(resource, record)) as Record<string, unknown>;
  const patch = Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key])));
  if (!Object.keys(patch).length) throw new Error("لا توجد تغييرات للحفظ.");
  return patch as ContentTypeMap[K]["input"];
}
