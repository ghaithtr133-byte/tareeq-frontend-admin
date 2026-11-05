"use client";
import { useQuery } from "@tanstack/react-query";
import { directoryApi, loadGalleryOrder, managementParams, universitySectionApi, type DirectoryKind, type ManagementListParams, type UniversitySection } from "@/api/university-management";
import { normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { uuidSchema } from "@/lib/university-schemas";

export function useDirectoryList<K extends DirectoryKind>(kind: K, params: ManagementListParams, enabled = true) {
  const access = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.directory.list(kind, managementParams(kind, params)),
    enabled: enabled && Boolean(access.user) && !access.mockEnabled, retry: false,
    queryFn: async ({ signal }) => {
      try { return await directoryApi.list(kind, params, { signal }); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
  });
}
export function useUniversitySection<K extends UniversitySection>(section: K, id: string, params: ManagementListParams, enabled = true) {
  const access = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.university.list(id, section, managementParams(section, params)),
    enabled: enabled && uuidSchema.safeParse(id).success && Boolean(access.user) && !access.mockEnabled, retry: false,
    queryFn: async ({ signal }) => {
      try { return await universitySectionApi.list(section, id, params, { signal }); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
  });
}

export function useGalleryOrder(id: string) {
  const access = useAdminAccess();
  return useQuery({ queryKey: [...queryKeys.admin.university.section(id, "gallery"), "complete-order"], enabled: Boolean(access.user) && !access.mockEnabled && uuidSchema.safeParse(id).success, retry: false, refetchOnMount: "always", refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => { try { return await loadGalleryOrder(id, signal); } catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; } },
  });
}
