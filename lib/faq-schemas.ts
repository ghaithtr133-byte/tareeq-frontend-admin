import { z } from "zod";
import { isoDateSchema, publicationStates, uuidSchema } from "@/lib/university-schemas";

export const faqScopes = ["GLOBAL", "COUNTRY", "UNIVERSITY", "SERVICE", "SCHOLARSHIP"] as const;
export type FaqScope = typeof faqScopes[number];
export const faqGroupSchema = z.object({ scope: z.enum(faqScopes), parentId: uuidSchema.nullable().optional() }).strict().superRefine((group, context) => {
  if (group.scope === "GLOBAL" ? group.parentId != null : !group.parentId) context.addIssue({ code: "custom", path: ["parentId"], message: "اختر ارتباطًا من نوع النطاق؛ النطاق العام بلا ارتباط." });
});
export type FaqGroup = z.infer<typeof faqGroupSchema>;
const fields = { questionAr: z.string().min(2).max(500), answerAr: z.string().min(2).max(10000), questionEn: z.string().min(2).max(500).nullable().optional(), answerEn: z.string().min(2).max(10000).nullable().optional(), status: z.enum(publicationStates).optional() };
export const faqCreateSchema = z.object({ scope: z.enum(faqScopes), parentId: uuidSchema.nullable().optional(), ...fields }).strict().superRefine((value, context) => { const result = faqGroupSchema.safeParse({ scope: value.scope, parentId: value.parentId }); if (!result.success) for (const issue of result.error.issues) context.addIssue({ code: "custom", path: issue.path, message: issue.message }); });
export const faqUpdateSchema = z.object(fields).partial().strict().refine(value => Object.keys(value).length > 0, "لا توجد تغييرات للحفظ.");
export const faqOrderSchema = z.object({ scope: z.enum(faqScopes), parentId: uuidSchema.nullable().optional(), orderedIds: z.array(uuidSchema).min(1).refine(ids => new Set(ids).size === ids.length, "لا تكرر الأسئلة.") }).strict().superRefine((value, context) => { const result = faqGroupSchema.safeParse({ scope: value.scope, parentId: value.parentId }); if (!result.success) for (const issue of result.error.issues) context.addIssue({ code: "custom", path: issue.path, message: issue.message }); });
export const faqListParamsSchema = z.object({ scope: z.enum(faqScopes), parentId: uuidSchema.nullable().optional(), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50), status: z.enum(publicationStates).optional() }).strict().superRefine((value, context) => { const result = faqGroupSchema.safeParse({ scope: value.scope, parentId: value.parentId }); if (!result.success) for (const issue of result.error.issues) context.addIssue({ code: "custom", path: issue.path, message: issue.message }); });
export const faqSchema = z.object({ id: uuidSchema, scope: z.enum(faqScopes), parentId: uuidSchema.nullable(), questionAr: z.string(), answerAr: z.string(), questionEn: z.string().nullable(), answerEn: z.string().nullable(), status: z.enum(publicationStates), displayOrder: z.number().int(), publishedAt: isoDateSchema.nullable(), createdAt: isoDateSchema, updatedAt: isoDateSchema });
export type Faq = z.infer<typeof faqSchema>;
export type FaqCreate = z.infer<typeof faqCreateSchema>;
export type FaqUpdate = z.infer<typeof faqUpdateSchema>;
export type FaqListParams = z.input<typeof faqListParamsSchema>;
export const faqScopeLabels: Record<FaqScope, string> = { GLOBAL: "عام / الصفحة الرئيسية", COUNTRY: "دولة", UNIVERSITY: "جامعة", SERVICE: "خدمة", SCHOLARSHIP: "منحة" };
