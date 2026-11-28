"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { articleAiApi } from "@/lib/api-client/article-ai";
import { normalizeApiError } from "@/lib/api-client/error";
import { assertContentSession, captureContentSession, type ContentSessionContext } from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

type SuggestionRequest = { id: string; signal?: AbortSignal; context: ContentSessionContext };

function useArticleAiMutation<TResult>(
  request: (id: string, signal?: AbortSignal) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const mutation = useMutation<TResult, unknown, SuggestionRequest>({
    gcTime: 0,
    retry: false,
    mutationFn: async ({ id, signal, context }: SuggestionRequest) => {
      assertContentSession(queryClient, context);
      try {
        const result = await request(id, signal);
        assertContentSession(queryClient, context);
        return result;
      } catch (error) {
        assertContentSession(queryClient, context, error);
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
  });

  return {
    ...mutation,
    generate: (id: string, signal?: AbortSignal) =>
      mutation.mutateAsync({
        id,
        signal,
        context: captureContentSession(queryClient, access.user?.id, access.mockEnabled),
      }),
  };
}

export function useArticleContentSuggestions() {
  return useArticleAiMutation((id, signal) => articleAiApi.contentSuggestions(id, { signal }));
}

export function useArticleSeoSuggestions() {
  return useArticleAiMutation((id, signal) => articleAiApi.seoSuggestions(id, { signal }));
}
