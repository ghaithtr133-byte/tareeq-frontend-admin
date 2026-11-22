"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { aboutApi } from "@/lib/api-client/about";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { assertContentSession, captureContentSession } from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function useAboutQuery() {
  const access = useAdminAccess(); const client = useQueryClient(); const userId = access.user?.id;
  return useQuery({ queryKey: queryKeys.admin.about(userId), enabled: Boolean(userId) && !access.mockEnabled, retry: false, queryFn: async ({ signal }) => {
    const context = captureContentSession(client, userId, false);
    try { const result = await aboutApi.get(signal); assertContentSession(client, context); return result; }
    catch (error) { assertContentSession(client, context, error); if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  } });
}
