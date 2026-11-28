"use client";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { directoryApi, loadGalleryOrder, managementParams, universitySectionApi, type DirectoryKind, type DirectoryRecords, type ManagementListParams, type UniversitySection } from "@/lib/api-client/university-management";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { ADMIN_SEARCH_DEBOUNCE_MS } from "@/lib/search-debounce";
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

const DIRECTORY_SELECTOR_PAGE_SIZE = 20;
const DIRECTORY_SELECTOR_STALE_TIME = 5 * 60 * 1000;

type DirectorySelectorOptions = {
  available?: boolean;
  params?: Omit<ManagementListParams, "page" | "limit" | "search">;
};

/** Lazy, server-searchable directory lookup used by relationship filters. */
export function useDirectorySelector<K extends DirectoryKind>(
  kind: K,
  { available = true, params }: DirectorySelectorOptions = {},
) {
  const access = useAdminAccess();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), ADMIN_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const queryParams = useMemo(
    () =>
      managementParams(kind, {
        ...(params ?? {}),
        page: 1,
        limit: DIRECTORY_SELECTOR_PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      }),
    [debouncedSearch, kind, params],
  );
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.admin.directory.root(kind), "selector", queryParams],
    initialPageParam: 1,
    enabled: available && open && Boolean(access.user) && !access.mockEnabled,
    retry: false,
    retryOnMount: false,
    staleTime: DIRECTORY_SELECTOR_STALE_TIME,
    queryFn: async ({ signal, pageParam }) => {
      try {
        return await directoryApi.list(kind, { ...queryParams, page: Number(pageParam) }, { signal });
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
  const items = useMemo(() => {
    const unique = new Map<string, DirectoryRecords[K]>();
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) unique.set(item.id, item);
    }
    return [...unique.values()];
  }, [query.data?.pages]);

  return {
    ...query,
    items: isSearchPending ? [] : items,
    isSearchPending,
    search,
    setSearch,
    setOpen,
  };
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
