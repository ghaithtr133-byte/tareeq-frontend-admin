import { z } from "zod";
import { apiClient } from "@/api/client";
import { faqCreateSchema, faqGroupSchema, faqListParamsSchema, faqOrderSchema, faqSchema, faqUpdateSchema, type Faq, type FaqCreate, type FaqGroup, type FaqListParams, type FaqUpdate } from "@/lib/faq-schemas";
import { uuidSchema } from "@/lib/university-schemas";
const pagination = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() });
function unwrap<T extends z.ZodType>(schema: T, response: unknown): z.infer<T> { return schema.parse(z.object({ success: z.literal(true), data: z.unknown() }).parse(response).data); }
export function faqParams(input: FaqListParams) { const params = faqListParamsSchema.parse(input); return { ...params, parentId: params.parentId ?? undefined }; }
export const faqApi = {
  async list(input: FaqListParams, signal?: AbortSignal) {
    const params = faqParams(input); const response = await apiClient.get("/admin/faqs", { params, signal });
    const result = unwrap(z.object({ items: z.array(faqSchema), pagination }), response.data);
    if (result.items.some(item => item.scope !== input.scope || item.parentId !== (input.parentId ?? null))) throw new Error("FAQ response does not belong to the requested group.");
    return result;
  },
  async create(input: FaqCreate) { const response = await apiClient.post("/admin/faqs", faqCreateSchema.parse(input)); return unwrap(faqSchema, response.data); },
  async update(id: string, input: FaqUpdate) { uuidSchema.parse(id); const response = await apiClient.patch(`/admin/faqs/${id}`, faqUpdateSchema.parse(input)); return unwrap(faqSchema, response.data); },
  async reorder(group: FaqGroup, orderedIds: string[]) { const response = await apiClient.patch("/admin/faqs/order", faqOrderSchema.parse({ ...group, orderedIds })); return unwrap(z.object({ items: z.array(faqSchema) }), response.data); },
};
/** Read every page without a status filter; a filtered page is never an order payload. */
export async function loadFaqOrder(group: FaqGroup, signal?: AbortSignal): Promise<Faq[]> {
  faqGroupSchema.parse(group); const result: Faq[] = []; let pages = 1; let total: number | undefined;
  for (let page = 1; page <= pages; page++) {
    const response = await faqApi.list({ ...group, page, limit: 100 }, signal);
    if (response.pagination.page !== page || (total !== undefined && total !== response.pagination.total) || (page < response.pagination.totalPages && response.items.length === 0)) throw new Error("تغيرت المجموعة؛ أعد تحميل الترتيب.");
    pages = response.pagination.totalPages; total = response.pagination.total; result.push(...response.items);
  }
  if (result.length !== total || new Set(result.map(item => item.id)).size !== result.length) throw new Error("تعذّر تحميل المجموعة كاملة.");
  return result.filter(item => item.status !== "ARCHIVED").sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
}
