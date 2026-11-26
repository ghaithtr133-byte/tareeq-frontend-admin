"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  articleHardDeleteApi,
  type ArticleHardDeleteResult,
} from "@/lib/api-client/content";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import {
  assertContentSession,
  captureContentSession,
  type ContentSessionContext,
} from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

type ArticleHardDeleteCommand =
  | { kind: "request"; id: string }
  | { kind: "confirm"; id: string; challengeId: string };

/** Removes only the deleted article and refetches active article list variants. */
export async function invalidateArticleAfterHardDelete(
  queryClient: Pick<ReturnType<typeof useQueryClient>, "removeQueries" | "invalidateQueries">,
  id: string,
) {
  queryClient.removeQueries({ queryKey: queryKeys.admin.content.detail("articles", id) });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.admin.content.resourceLists("articles"),
  });
}

/**
 * One mutation serializes the initial DELETE and any challenge confirmation.
 * The client never retries either operation: an ambiguous DELETE must not be
 * replayed automatically.
 */
export function useArticleHardDeleteMutation() {
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const mutation = useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: async ({ command, context }: { command: ArticleHardDeleteCommand; context: ContentSessionContext }) => {
      assertContentSession(queryClient, context);
      try {
        const result = command.kind === "request"
          ? await articleHardDeleteApi.request(command.id)
          : await articleHardDeleteApi.confirm(command.id, command.challengeId);
        assertContentSession(queryClient, context);
        return result;
      } catch (error) {
        assertContentSession(queryClient, context, error);
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
    onSuccess: async (result: ArticleHardDeleteResult, { command, context }) => {
      assertContentSession(queryClient, context);
      await invalidateArticleAfterHardDelete(queryClient, result.id || command.id);
      assertContentSession(queryClient, context);
    },
  });

  async function run(command: ArticleHardDeleteCommand) {
    const context = captureContentSession(queryClient, access.user?.id, access.mockEnabled);
    const result = await mutation.mutateAsync({ command, context });
    assertContentSession(queryClient, context);
    return result;
  }

  return {
    ...mutation,
    request: (id: string) => run({ kind: "request", id }),
    confirm: (id: string, challengeId: string) => run({ kind: "confirm", id, challengeId }),
  };
}
