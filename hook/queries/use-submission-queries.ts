"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { isSubmissionId, serializeSubmissionParams, submissionApi, type SubmissionParamsMap, type SubmissionResource } from "@/lib/api-client/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function useSubmissionList<K extends SubmissionResource>(
  resource: K,
  params: SubmissionParamsMap[K],
  enabled = true,
) {
  const access = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.submissions.list(resource, serializeSubmissionParams(resource, params)),
    enabled: Boolean(access.user) && !access.mockEnabled && enabled,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      try { return await submissionApi.list(resource, params, { signal }); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
  });
}

/** Server-paginated batches for the Applications mobile card view. */
export function useInfiniteSubmissionList<K extends SubmissionResource>(
  resource: K,
  params: Omit<SubmissionParamsMap[K], "page" | "limit">,
  limit: number,
  enabled = true,
) {
  const access = useAdminAccess();
  return useInfiniteQuery({
    queryKey: [...queryKeys.admin.submissions.list(resource, params as SubmissionParamsMap[K]), "infinite", limit],
    initialPageParam: 1,
    enabled: Boolean(access.user) && !access.mockEnabled && enabled,
    gcTime: 0,
    retry: false,
    queryFn: async ({ pageParam, signal }) => {
      try {
        return await submissionApi.list(
          resource,
          { ...params, page: Number(pageParam), limit } as SubmissionParamsMap[K],
          { signal },
        );
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

export function useSubmissionDetail<K extends SubmissionResource>(resource: K, id: string) {
  const access = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.submissions.detail(resource, id),
    enabled: Boolean(access.user) && !access.mockEnabled && isSubmissionId(id),
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      try { return await submissionApi.get(resource, id, { signal }); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
  });
}
