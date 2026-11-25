"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AboutUsUpdateRequest } from "@/lib/about-schemas";
import { aboutApi } from "@/lib/api-client/about";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { assertContentSession, captureContentSession, StaleContentSessionError, type ContentSessionContext } from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function useAboutMutation() {
  const access = useAdminAccess(); const client = useQueryClient();
  const mutation = useMutation({ retry: false, gcTime: 0, mutationFn: async ({ input, context }: { input: AboutUsUpdateRequest; context: ContentSessionContext }) => {
    assertContentSession(client, context);
    try {
      const saved = await aboutApi.update(input);
      assertContentSession(client, context);
      const queryKey = queryKeys.admin.about(context.userId);
      // A GET already in progress must not overwrite the PATCH response.
      await client.cancelQueries({ queryKey, exact: true });
      assertContentSession(client, context);
      client.setQueryData(queryKey, saved);
      await client.invalidateQueries({ queryKey, exact: true, refetchType: "none" });
      return saved;
    } catch (error) {
      assertContentSession(client, context, error);
      if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
      throw error;
    }
  } });
  async function save(input: AboutUsUpdateRequest) {
    if (access.mockEnabled) throw new StaleContentSessionError();
    const context = captureContentSession(client, access.user?.id, false);
    const saved = await mutation.mutateAsync({ input, context });
    assertContentSession(client, context);
    return saved;
  }
  return { save, isPending: mutation.isPending };
}
