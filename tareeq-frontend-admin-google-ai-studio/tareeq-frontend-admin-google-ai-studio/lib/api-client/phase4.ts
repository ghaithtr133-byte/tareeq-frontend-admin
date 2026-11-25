import { z } from "zod";
import { apiClient } from "@/lib/api-client/client";
import { accountParamsSchema, accountSchema, accountUpdateSchema, analyticsParamsSchema, analyticsSummarySchema, auditParamsSchema, auditSchema, journeyParamsSchema, journeySchema, paginationSchema, type AccountParams, type AccountUpdate, type AnalyticsParams, type AuditParams, type JourneyParams } from "@/lib/phase4-schemas";
import { uuidSchema } from "@/lib/university-schemas";
function data<T extends z.ZodType>(schema: T, response: unknown): z.infer<T> { return schema.parse(z.object({ success: z.literal(true), data: z.unknown() }).parse(response).data); }
export const phase4Api = {
  async summary(params: AnalyticsParams, signal?: AbortSignal) { const result = await apiClient.get("/admin/analytics/summary", { signal, params: analyticsParamsSchema.parse(params) }); return data(analyticsSummarySchema, result.data); },
  async journeys(params: JourneyParams, signal?: AbortSignal) { const result = await apiClient.get("/admin/analytics/journeys", { signal, params: journeyParamsSchema.parse(params) }); return data(journeySchema, result.data); },
  async accounts(params: AccountParams, signal?: AbortSignal) { const result = await apiClient.get("/admin/users", { signal, params: accountParamsSchema.parse(params) }); return data(z.object({ items: z.array(accountSchema), pagination: paginationSchema }), result.data); },
  async updateAccount(id: string, input: AccountUpdate) { uuidSchema.parse(id); const result = await apiClient.patch(`/admin/users/${id}`, accountUpdateSchema.parse(input)); return data(accountSchema, result.data); },
  async audit(params: AuditParams, signal?: AbortSignal) { const result = await apiClient.get("/admin/audit-logs", { signal, params: auditParamsSchema.parse(params) }); return data(z.object({ items: z.array(auditSchema), pagination: paginationSchema }), result.data); },
};
