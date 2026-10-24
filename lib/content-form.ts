import { z } from "zod";

import type { AdminContentResource, Article, ArticleRichTextBlock, ContentRecord, ContentTypeMap } from "@/api/content";
import { articleBlockOptions, contentDefinitions } from "@/lib/content-config";

export type ContentFormValues = Record<string, string | boolean | ArticleRichTextBlock[] | undefined>;

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.");
const urlSchema = z.string().url("أدخل رابطًا صالحًا.");
const articleBlockSchema = z.object({
  type: z.enum(articleBlockOptions.map((option) => option.value) as ["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote"]),
  text: z.string().trim().min(1, "أدخل نص الكتلة.").max(10000),
});

export function initialContentValues(resource: AdminContentResource, record?: ContentRecord): ContentFormValues {
  const values: ContentFormValues = { featured: false, status: "DRAFT" };
  for (const field of contentDefinitions[resource].fields) {
    const recordValue = record ? (record as unknown as Record<string, unknown>)[field.name] : undefined;
    if (field.kind === "checkbox") values[field.name] = typeof recordValue === "boolean" ? recordValue : false;
    else if (field.kind === "number") values[field.name] = recordValue === undefined || recordValue === null ? "0" : String(recordValue);
    else values[field.name] = field.kind === "datetime-local" ? toDateTimeLocal(recordValue) : recordValue === undefined || recordValue === null ? "" : String(recordValue);
  }
  if (resource === "scholarships" && !values.applicationStatus) values.applicationStatus = "OPEN";
  if (resource === "articles") {
    const article = record as Article | undefined;
    values.bodyAr = article?.bodyAr ?? [{ type: "paragraph", text: "" }];
    values.bodyEn = article?.bodyEn ?? [];
  }
  return values;
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function toDateTimeLocal(value: unknown): string {
  return typeof value === "string" ? new Date(value).toISOString().slice(0, 16) : "";
}

export function validateContentValues(resource: AdminContentResource, values: ContentFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of contentDefinitions[resource].fields) {
    const value = values[field.name];
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
    if (field.name === "slug" && !slugSchema.safeParse(text).success) errors[field.name] = "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.";
    if (field.kind === "url" && !urlSchema.safeParse(text).success) errors[field.name] = "أدخل رابطًا صالحًا.";
  }
  if (resource === "articles") {
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
    payload.bodyAr = values.bodyAr ?? [];
    payload.bodyEn = Array.isArray(values.bodyEn) && values.bodyEn.length ? values.bodyEn : null;
  }
  return payload as ContentTypeMap[K]["input"];
}
