"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { phase4Api } from "@/api/phase4";
import { queryKeys } from "@/api/query-keys";
import { normalizeApiError } from "@/api/error";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { assertSuperAdminSession, isSuperAdmin } from "@/lib/privileged-access";
import { accountParamsSchema, analyticsParamsSchema, auditParamsSchema, journeyParamsSchema, type AccountParams, type AnalyticsParams, type AuditParams, type JourneyParams } from "@/lib/phase4-schemas";
function usePrivilegedQuery<T>(key: readonly unknown[], load: (signal: AbortSignal) => Promise<T>) {
  const access = useAdminAccess(); const client = useQueryClient(); const id = access.user?.id;
  const allowed = !access.mockEnabled && isSuperAdmin(access.user?.role) && Boolean(id);
  const query = useQuery({ queryKey: key, enabled: allowed, retry: false, queryFn: async ({ signal }) => {
    assertSuperAdminSession(client, id);
    try { const result = await load(signal); assertSuperAdminSession(client, id); return result; }
    catch (error) { const status = normalizeApiError(error).status; if (status === 401) access.reportContentUnauthorized(); else if (status === 403) void access.refetchSession(); throw error; }
  } });
  return { ...query, data: allowed && !query.isError ? query.data : undefined };
}
export function useAnalyticsSummary(params: AnalyticsParams) { const access = useAdminAccess(); return usePrivilegedQuery(queryKeys.admin.privileged.summary(access.user?.id ?? "missing", analyticsParamsSchema.parse(params)), signal => phase4Api.summary(params, signal)); }
export function useAnalyticsJourneys(params: JourneyParams) { const access = useAdminAccess(); return usePrivilegedQuery(queryKeys.admin.privileged.journeys(access.user?.id ?? "missing", journeyParamsSchema.parse(params)), signal => phase4Api.journeys(params, signal)); }
export function useManagedAccounts(params: AccountParams) { const access = useAdminAccess(); return usePrivilegedQuery(queryKeys.admin.privileged.accountList(access.user?.id ?? "missing", accountParamsSchema.parse(params)), signal => phase4Api.accounts(params, signal)); }
export function useAuditLogs(params: AuditParams) { const access = useAdminAccess(); return usePrivilegedQuery(queryKeys.admin.privileged.auditList(access.user?.id ?? "missing", auditParamsSchema.parse(params)), signal => phase4Api.audit(params, signal)); }
