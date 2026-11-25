"use client";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsApi } from "@/lib/api-client/site-settings";
import { queryKeys } from "@/lib/api-client/query-keys";
import { useAdminAccess } from "@/providers/admin-access-provider";
export function useSiteSettingsQuery() {
  const access = useAdminAccess();
  return useQuery({ queryKey: queryKeys.admin.settings, enabled: Boolean(access.user) && !access.mockEnabled, retry: false, queryFn: ({ signal }) => siteSettingsApi.get(signal) });
}
