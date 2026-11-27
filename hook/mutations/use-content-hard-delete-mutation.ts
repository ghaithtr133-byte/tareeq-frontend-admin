"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  contentHardDeleteApi,
  type ContentHardDeleteResult,
  type DeletionImpact,
  type HardDeletableContentResource,
} from "@/lib/api-client/content";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import {
  assertContentSession,
  captureContentSession,
  type ContentSessionContext,
} from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

type ContentHardDeleteCommand =
  | { kind: "request"; resource: HardDeletableContentResource; id: string }
  | { kind: "confirm"; resource: HardDeletableContentResource; id: string; challengeId: string };

const resourceFromImpact: Record<string, HardDeletableContentResource | undefined> = {
  COUNTRY: "countries",
  UNIVERSITY: "universities",
  SCHOLARSHIP: "scholarships",
  ARTICLE: "articles",
  countries: "countries",
  universities: "universities",
  scholarships: "scholarships",
  articles: "articles",
};

function affectedResources(resource: HardDeletableContentResource, impact: DeletionImpact) {
  const resources = new Set<HardDeletableContentResource>([resource]);
  const target = resourceFromImpact[impact.target.resource];
  if (target) resources.add(target);
  for (const item of impact.items) {
    const related = resourceFromImpact[item.resourceType];
    if (related) resources.add(related);
  }
  return resources;
}

/** Clears only target/impacted content caches supplied by the server impact graph. */
export async function invalidateContentAfterHardDelete(
  queryClient: Pick<ReturnType<typeof useQueryClient>, "removeQueries" | "invalidateQueries">,
  resource: HardDeletableContentResource,
  id: string,
  impact: DeletionImpact,
) {
  queryClient.removeQueries({ queryKey: queryKeys.admin.content.detail(resource, id) });
  const resources = affectedResources(resource, impact);
  await Promise.all([...resources].map((affected) => queryClient.invalidateQueries({
    queryKey: queryKeys.admin.content.resourceLists(affected),
  })));
  if ([...resources].some((affected) => affected === "countries" || affected === "universities" || affected === "scholarships")) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.selectors() });
  }
}

/** No automatic retry: a destructive request or confirmation is never replayed. */
export function useContentHardDeleteMutation() {
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const mutation = useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: async ({ command, context }: { command: ContentHardDeleteCommand; context: ContentSessionContext }) => {
      assertContentSession(queryClient, context);
      try {
        const result = command.kind === "request"
          ? await contentHardDeleteApi.request(command.resource, command.id)
          : await contentHardDeleteApi.confirm(command.resource, command.id, command.challengeId);
        assertContentSession(queryClient, context);
        return result;
      } catch (error) {
        assertContentSession(queryClient, context, error);
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
    onSuccess: async (result: ContentHardDeleteResult, { command, context }) => {
      assertContentSession(queryClient, context);
      await invalidateContentAfterHardDelete(queryClient, command.resource, result.id || command.id, result.impact);
      assertContentSession(queryClient, context);
    },
  });

  async function run(command: ContentHardDeleteCommand) {
    const context = captureContentSession(queryClient, access.user?.id, access.mockEnabled);
    const result = await mutation.mutateAsync({ command, context });
    assertContentSession(queryClient, context);
    return result;
  }

  return {
    ...mutation,
    request: (resource: HardDeletableContentResource, id: string) => run({ kind: "request", resource, id }),
    confirm: (resource: HardDeletableContentResource, id: string, challengeId: string) => run({ kind: "confirm", resource, id, challengeId }),
  };
}
