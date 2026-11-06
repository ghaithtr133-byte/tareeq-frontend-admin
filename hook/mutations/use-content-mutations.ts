"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { normalizeApiError } from "@/lib/api-client/error";
import type { AdminContentResource, ContentTypeMap } from "@/lib/api-client/content";
import { queryKeys } from "@/lib/api-client/query-keys";
import { useAdminAccess, useContentRepository } from "@/providers/admin-access-provider";
import { assertContentSession, captureContentSession, type ContentSessionContext } from "@/lib/content-session";

export async function invalidateContentAfterCreate(queryClient: Pick<ReturnType<typeof useQueryClient>, "invalidateQueries">) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.lists() }),
    // Countries, universities, and scholarships are all form relationships.
    // A successful create must therefore refresh selector collections too.
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.selectors() }),
  ]);
}

function useGuardedContentMutation<K extends AdminContentResource, V>(resource: K, write: (value: V) => Promise<ContentTypeMap[K]["record"]>, create: boolean) {
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: async ({ value, context }: { value: V; context: ContentSessionContext }) => {
      assertContentSession(queryClient, context);
      try {
        const record = await write(value);
        assertContentSession(queryClient, context);
        return record;
      } catch (error) {
        // Late failures must not revalidate or disturb another session either.
        assertContentSession(queryClient, context, error);
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
    retry: false,
    onSuccess: async (record, { context }) => {
      assertContentSession(queryClient, context);
      if (create) await invalidateContentAfterCreate(queryClient);
      else {
        queryClient.setQueryData(queryKeys.admin.content.detail(resource, record.id), record);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.lists() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.detail(resource, record.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.selectors() }),
        ]);
      }
    },
  });
  async function mutateAsync(value: V) {
    const context = captureContentSession(queryClient, access.user?.id, access.mockEnabled);
    const record = await mutation.mutateAsync({ value, context });
    // Also guard the caller's redirect/success continuation after async invalidation.
    assertContentSession(queryClient, context);
    return record;
  }
  return { ...mutation, mutateAsync, mutate: (value: V) => { void mutateAsync(value).catch(() => undefined); } };
}

export function useCreateContent<K extends AdminContentResource>(resource: K) {
  const getApi = useContentRepository();
  return useGuardedContentMutation(resource, (input: ContentTypeMap[K]["input"]) => getApi(resource).create(input), true);
}

export function useUpdateContent<K extends AdminContentResource>(resource: K) {
  const getApi = useContentRepository();
  return useGuardedContentMutation(resource, ({ id, input }: { id: string; input: ContentTypeMap[K]["input"] }) => getApi(resource).update(id, input), false);
}
