import { faqCreateSchema, faqUpdateSchema, type Faq, type FaqGroup } from "@/lib/faq-schemas";
export type FaqFormValues = { questionAr: string; answerAr: string; questionEn: string; answerEn: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };
export function faqFormValues(record?: Faq): FaqFormValues { return { questionAr: record?.questionAr ?? "", answerAr: record?.answerAr ?? "", questionEn: record?.questionEn ?? "", answerEn: record?.answerEn ?? "", status: record?.status ?? "DRAFT" }; }
export function faqFormPayload(group: FaqGroup, values: FaqFormValues, record?: Faq, cleared: readonly ("questionEn" | "answerEn")[] = []) {
  const payload: Record<string, unknown> = {}; const original = faqFormValues(record);
  for (const key of ["questionAr", "answerAr", "questionEn", "answerEn", "status"] as const) {
    const translation = key === "questionEn" || key === "answerEn";
    if (translation && cleared.includes(key)) { if (!record || record[key] !== null) payload[key] = null; }
    else if (record ? values[key] !== original[key] : !translation || values[key] !== "") payload[key] = values[key];
  }
  return record ? faqUpdateSchema.parse(payload) : faqCreateSchema.parse({ ...group, ...payload });
}
