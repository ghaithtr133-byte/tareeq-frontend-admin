"use client";

import { useQuery } from "@tanstack/react-query";

import { normalizeApiError } from "@/api/error";
import type { AdminContentResource, ContentTypeMap } from "@/api/content";
import { queryKeys } from "@/api/query-keys";
import { useAdminAccess, useContentRepository } from "@/providers/admin-access-provider";

export function useContentList<K extends AdminContentResource>(resource: K, params: ContentTypeMap[K]["params"], enabled = true) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.list(resource, params),
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

function useContentSelector<K extends AdminContentResource>(resource: K, sort: ContentTypeMap[K]["params"] extends { sort?: infer T } ? T : never, enabled: boolean) {
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.selector(resource),
    enabled,
    queryFn: async ({ signal }) => {
      try {
        const first = await getApi(resource).list({ page: 1, limit: 50, sort } as ContentTypeMap[K]["params"], { signal });
        const pages = await Promise.all(Array.from({ length: Math.max(first.pagination.totalPages - 1, 0) }, (_, index) =>
          getApi(resource).list({ page: index + 2, limit: 50, sort } as ContentTypeMap[K]["params"], { signal }),
        ));
        return {
          items: [first, ...pages].flatMap((page) => page.items),
          pagination: { ...first.pagination, page: 1, limit: Math.max(first.pagination.total, 1), totalPages: 1 },
        };
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
  });
}

/** Relationship selectors page through documented collection endpoints rather than truncating at 50 records. */
export function useContentSelectors(include: { countries?: boolean; universities?: boolean; scholarships?: boolean }) {
  const countries = useContentSelector("countries", "manual", include.countries ?? false);
  const universities = useContentSelector("universities", "name", include.universities ?? false);
  const scholarships = useContentSelector("scholarships", "newest", include.scholarships ?? false);
  return { countries, universities, scholarships };
}
