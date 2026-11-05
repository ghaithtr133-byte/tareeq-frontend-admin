"use client";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { siteSettingsApi } from "@/api/site-settings";
import { normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import type { SiteSettingsUpdate } from "@/lib/site-settings-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
export function canEditSiteSettings(role: string | undefined) { return role === "SUPER_ADMIN"; }
export function invalidateSiteSettings(client: Pick<QueryClient, "invalidateQueries">) { return client.invalidateQueries({ queryKey: queryKeys.admin.settings }); }
export function useSiteSettingsMutation() {
  const access = useAdminAccess(); const client = useQueryClient();
  return useMutation({ retry: false, gcTime: 0, mutationFn: async (input: SiteSettingsUpdate) => {
    if (access.mockEnabled || !access.user || !canEditSiteSettings(access.user.role)) throw new Error("SUPER_ADMIN is required.");
    try { return await siteSettingsApi.update(input); } catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  }, onSuccess: () => invalidateSiteSettings(client) });
}
