import { z } from "zod";

import { isoDateSchema, uuidSchema } from "@/lib/university-schemas";

export const detailKinds = ["STEP", "BENEFIT", "REQUIREMENT", "APPLICATION_STEP"] as const;
export type DetailKind = typeof detailKinds[number];
export type DetailResource = "countries" | "services" | "scholarships";

export type DetailSection = { kind: DetailKind; label: string; description: string };
const detailSections: Record<DetailResource, readonly DetailSection[]> = {
  countries: [
    { kind: "STEP", label: "خطوات الدليل", description: "عناصر إرشادية مرتبة ضمن دليل الدراسة." },
    { kind: "REQUIREMENT", label: "متطلبات الدليل", description: "متطلبات أو وثائق مرتبطة بمحتوى الدليل." },
    { kind: "BENEFIT", label: "مزايا الدليل", description: "معلومات داعمة ضمن الدليل، لا ملخصات رسوم الدولة." },
    { kind: "APPLICATION_STEP", label: "خطوات التقديم", description: "خطوات إرشادية للتقديم ضمن الدليل." },
  ],
  scholarships: [
    { kind: "BENEFIT", label: "مزايا المنحة", description: "المزايا أو التغطية التي توثقها الجهة المانحة." },
    { kind: "REQUIREMENT", label: "متطلبات المنحة", description: "الشروط أو الوثائق المطلوبة للتقديم." },
    { kind: "APPLICATION_STEP", label: "خطوات التقديم", description: "خطوات التقديم التي تنشرها الجهة الرسمية." },
  ],
  services: [
    { kind: "STEP", label: "خطوات الخدمة", description: "كيف تُقدَّم الخدمة أو مراحلها." },
    { kind: "BENEFIT", label: "مزايا الخدمة", description: "ما توضحه الخدمة للطالب." },
  ],
};

/** Presentation labels only. They never infer public-site accordion categories. */
export function detailSectionsFor(resource: DetailResource) { return detailSections[resource]; }
export function detailSectionFor(resource: DetailResource, kind: DetailKind) { return detailSectionsFor(resource).find(section => section.kind === kind); }

const nullableText = (max: number) => z.string().min(1).max(max).nullable();
const optionalFields = {
  descriptionAr: nullableText(20_000),
  bodyAr: nullableText(20_000),
  category: nullableText(80),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  coveragePeriod: nullableText(120),
  officialSourceUrl: z.url().nullable(),
  verifiedAt: isoDateSchema.nullable(),
};

export const detailCreateSchema = z.strictObject({
  kind: z.enum(detailKinds),
  titleAr: z.string().min(1).max(300),
  ...optionalFields,
}).partial({ descriptionAr: true, bodyAr: true, category: true, amount: true, currency: true, coveragePeriod: true, officialSourceUrl: true, verifiedAt: true });

/** Parent and kind are immutable after creation; an empty PATCH is rejected locally. */
export const detailPatchSchema = z.strictObject({
  titleAr: z.string().min(1).max(300),
  ...optionalFields,
}).partial().refine(input => Object.values(input).some(value => value !== undefined), "لا توجد تغييرات للحفظ.");

export const detailOrderSchema = z.strictObject({
  kind: z.enum(detailKinds),
  orderedIds: z.array(uuidSchema).max(500).refine(ids => new Set(ids).size === ids.length, "لا تكرر معرّفًا في الترتيب."),
});

export type DetailCreateInput = z.infer<typeof detailCreateSchema>;
export type DetailPatchInput = z.infer<typeof detailPatchSchema>;

/**
 * The published operations omit a response-item schema. These are the only
 * fields needed by the editor: documented writable fields plus id/kind/order.
 * Unknown server fields are retained rather than being treated as editable.
 */
export const detailItemSchema = z.object({
  id: uuidSchema,
  kind: z.enum(detailKinds),
  titleAr: z.string(),
  descriptionAr: z.string().nullable().optional(),
  bodyAr: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  amount: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  coveragePeriod: z.string().nullable().optional(),
  officialSourceUrl: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
}).passthrough();
export type DetailItem = z.infer<typeof detailItemSchema>;

const editableFields = ["titleAr", "descriptionAr", "bodyAr", "category", "amount", "currency", "coveragePeriod", "officialSourceUrl", "verifiedAt"] as const;
export type DetailFormValues = Partial<Record<typeof editableFields[number], string | null>> & { kind: DetailKind };

export function detailValues(item?: DetailItem, kind: DetailKind = "STEP"): DetailFormValues {
  const values: DetailFormValues = { kind };
  for (const field of editableFields) values[field] = item?.[field] ?? null;
  if (item) values.kind = item.kind;
  return values;
}

function normalizeField(field: typeof editableFields[number], value: string | null | undefined) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const text = value.trim();
  if (!text) return undefined;
  return field === "verifiedAt" ? new Date(text).toISOString() : text;
}

export function detailCreatePayload(values: DetailFormValues): DetailCreateInput {
  const payload: Record<string, unknown> = { kind: values.kind };
  for (const field of editableFields) {
    const value = normalizeField(field, values[field]);
    if (value !== undefined) payload[field] = value;
  }
  return detailCreateSchema.parse(payload);
}

export function detailPatchPayload(values: DetailFormValues, baseline: DetailItem): DetailPatchInput {
  const payload: Record<string, unknown> = {};
  for (const field of editableFields) {
    const next = normalizeField(field, values[field]);
    const previous = normalizeField(field, baseline[field] ?? null);
    if (next === undefined) continue;
    if (next !== previous) payload[field] = next;
  }
  return detailPatchSchema.parse(payload);
}
