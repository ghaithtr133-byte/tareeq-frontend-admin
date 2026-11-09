"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contentDetailApi } from "@/lib/api-client/content-details";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import type { DetailCreateInput, DetailKind, DetailPatchInput, DetailResource } from "@/lib/content-detail-schemas";
import { assertContentSession, captureContentSession, type ContentSessionContext } from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

type DetailAction =
  | { type: "create"; kind: DetailKind; input: DetailCreateInput }
  | { type: "update"; kind: DetailKind; id: string; input: DetailPatchInput }
  | { type: "remove"; kind: DetailKind; id: string }
  | { type: "reorder"; kind: DetailKind; orderedIds: string[] };

export function useContentDetailMutation(resource: DetailResource, parentId: string) {
  const client = useQueryClient(); const access = useAdminAccess();
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ action, context }: { action: DetailAction; context: ContentSessionContext }) => {
      assertContentSession(client, context);
      try {
        if (action.type === "create") return await contentDetailApi.create(resource, parentId, action.input);
        if (action.type === "update") return await contentDetailApi.update(resource, parentId, action.id, action.input);
        if (action.type === "remove") return await contentDetailApi.remove(resource, parentId, action.id);
        return await contentDetailApi.reorder(resource, parentId, action.kind, action.orderedIds);
      } catch (error) {
        assertContentSession(client, context, error);
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
    onSuccess: async (_, { context }) => {
      assertContentSession(client, context);
      await client.invalidateQueries({ queryKey: queryKeys.admin.content.detailItems(resource, parentId) });
    },
  });
  async function mutateAsync(action: DetailAction) {
    const context = captureContentSession(client, access.user?.id, access.mockEnabled);
    const result = await mutation.mutateAsync({ action, context });
    assertContentSession(client, context);
    return result;
  }
  return { ...mutation, mutateAsync };
}
