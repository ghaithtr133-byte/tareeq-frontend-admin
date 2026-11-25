"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { directoryApi, loadGalleryOrder, managementParams, universitySectionApi, type DirectoryKind, type ManagementListParams, type UniversitySection } from "@/lib/api-client/university-management";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
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

/** Mobile directory cards use the same documented paginated endpoint, five records at a time. */
export function useInfiniteDirectoryList<K extends DirectoryKind>(kind: K, params: ManagementListParams, enabled = true) {
  const access = useAdminAccess();
  const normalized = managementParams(kind, params);
  return useInfiniteQuery({
    queryKey: [...queryKeys.admin.directory.root(kind), "infinite", normalized],
    initialPageParam: 1,
    enabled: enabled && Boolean(access.user) && !access.mockEnabled,
    retry: false,
    queryFn: async ({ signal, pageParam }) => {
      try {
        return await directoryApi.list(kind, { ...params, page: Number(pageParam) }, { signal });
      } catch (error) {
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
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
