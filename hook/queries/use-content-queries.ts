"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { normalizeApiError } from "@/lib/api-client/error";
import type { AdminContentResource, ContentTypeMap } from "@/lib/api-client/content";
import { queryKeys } from "@/lib/api-client/query-keys";
import { ADMIN_SEARCH_DEBOUNCE_MS } from "@/lib/search-debounce";
import { useAdminAccess, useContentRepository } from "@/providers/admin-access-provider";

export function useContentList<K extends AdminContentResource>(resource: K, params: ContentTypeMap[K]["params"], enabled = true, retry?: false) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.list(resource, params),
    ...(retry === false ? { retry: false } : {}),
    queryFn: async ({ signal }) => {
      try {
        return await getApi(resource).list(params, { signal });
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    enabled,
  });
}

/** Server-paginated list for mobile cards. Pages are never merged or sorted client-side. */
export function useInfiniteContentList<K extends AdminContentResource>(
  resource: K,
  params: Omit<ContentTypeMap[K]["params"], "page" | "limit">,
  limit: number,
  enabled = true,
) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useInfiniteQuery({
    queryKey: [...queryKeys.admin.content.list(resource, params), "infinite", limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await getApi(resource).list(
          { ...params, page: Number(pageParam), limit } as ContentTypeMap[K]["params"],
          { signal },
        );
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled,
  });
}

export function useContentDetail<K extends AdminContentResource>(resource: K, id: string | undefined) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.detail(resource, id ?? "missing"),
    queryFn: async ({ signal }) => {
      try {
        return await getApi(resource).get(id!, { signal });
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    enabled: Boolean(id),
  });
}

export const CONTENT_SELECTOR_PAGE_SIZE = 20;
const CONTENT_SELECTOR_STALE_TIME = 5 * 60 * 1000;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

type ContentSelectorOptions<K extends AdminContentResource> = {
  available?: boolean;
  params?: Omit<ContentTypeMap[K]["params"], "page" | "limit" | "search" | "sort">;
};

/**
 * Lazy server-backed relationship lookup. It does not fetch until its UI is
 * opened; a distinct, debounced query key makes stale search results inert.
 */
export function useContentSelector<K extends AdminContentResource>(
  resource: K,
  sort: ContentTypeMap[K]["params"] extends { sort?: infer T } ? T : never,
  { available = true, params }: ContentSelectorOptions<K> = {},
) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, ADMIN_SEARCH_DEBOUNCE_MS);
  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const queryParams = useMemo(
    () => ({
      ...(params ?? {}),
      page: 1,
      limit: CONTENT_SELECTOR_PAGE_SIZE,
      sort,
      search: debouncedSearch.trim() || undefined,
    }) as ContentTypeMap[K]["params"],
    [debouncedSearch, params, sort],
  );
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.admin.content.selector(resource), queryParams, "infinite"],
    retry: false,
    retryOnMount: false,
    staleTime: CONTENT_SELECTOR_STALE_TIME,
    enabled: available && open,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await getApi(resource).list(
          { ...queryParams, page: Number(pageParam) } as ContentTypeMap[K]["params"],
          { signal },
        );
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const items = useMemo(() => {
    const unique = new Map<string, ContentTypeMap[K]["record"]>();
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) unique.set(item.id, item);
    }
    return [...unique.values()];
  }, [query.data?.pages]);

  return {
    ...query,
    // Do not render a prior search page during the debounce window.
    items: isSearchPending ? [] : items,
    isSearchPending,
    open,
    search,
    setOpen,
    setSearch,
  };
}

/**
 * Existing table-filter options are intentionally kept separate from the
 * relationship selector above. Those filters are outside this change and
 * retain their established complete option-list behaviour.
 */
function useContentFilterOptions<K extends AdminContentResource>(
  resource: K,
  sort: ContentTypeMap[K]["params"] extends { sort?: infer T } ? T : never,
  enabled: boolean,
) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.selector(resource),
    retry: false,
    retryOnMount: false,
    enabled,
    queryFn: async ({ signal }) => {
      try {
        const first = await getApi(resource).list(
          { page: 1, limit: 50, sort } as ContentTypeMap[K]["params"],
          { signal },
        );
        const pages = await Promise.all(
          Array.from({ length: Math.max(first.pagination.totalPages - 1, 0) }, (_, index) =>
            getApi(resource).list(
              { page: index + 2, limit: 50, sort } as ContentTypeMap[K]["params"],
              { signal },
            ),
          ),
        );
        return {
          items: [first, ...pages].flatMap((page) => page.items),
          pagination: {
            ...first.pagination,
            page: 1,
            limit: Math.max(first.pagination.total, 1),
            totalPages: 1,
          },
        };
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
  });
}

/** Existing table-filter provider; relationship forms use `useContentSelector`. */
export function useContentSelectors(include: { countries?: boolean; universities?: boolean; scholarships?: boolean }) {
  const countries = useContentFilterOptions("countries", "manual", include.countries ?? false);
  const universities = useContentFilterOptions("universities", "name", include.universities ?? false);
  const scholarships = useContentFilterOptions("scholarships", "newest", include.scholarships ?? false);
  return { countries, universities, scholarships };
}
