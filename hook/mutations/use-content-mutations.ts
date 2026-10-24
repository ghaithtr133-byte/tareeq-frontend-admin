"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { normalizeApiError } from "@/api/error";
import type { AdminContentResource, ContentTypeMap } from "@/api/content";
import { queryKeys } from "@/api/query-keys";
import { useAdminAccess, useContentRepository } from "@/providers/admin-access-provider";

export async function invalidateContentAfterCreate(queryClient: Pick<ReturnType<typeof useQueryClient>, "invalidateQueries">) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.lists() }),
    // Countries, universities, and scholarships are all form relationships.
    // A successful create must therefore refresh selector collections too.
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.selectors() }),
  ]);
}

export function useCreateContent<K extends AdminContentResource>(resource: K) {
  const queryClient = useQueryClient();
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useMutation({
    mutationFn: async (input: ContentTypeMap[K]["input"]) => {
      try {
        return await getApi(resource).create(input);
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    retry: false,
    onSuccess: () => invalidateContentAfterCreate(queryClient),
  });
}

export function useUpdateContent<K extends AdminContentResource>(resource: K) {
  const queryClient = useQueryClient();
  const getApi = useContentRepository();
  const { reportContentUnauthorized } = useAdminAccess();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ContentTypeMap[K]["input"] }) => {
      try {
        return await getApi(resource).update(id, input);
      } catch (error) {
        if (normalizeApiError(error).status === 401) reportContentUnauthorized();
        throw error;
      }
    },
    retry: false,
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.lists() });
      queryClient.setQueryData(queryKeys.admin.content.detail(resource, record.id), record);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.detail(resource, record.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.selectors() });
    },
  });
}
