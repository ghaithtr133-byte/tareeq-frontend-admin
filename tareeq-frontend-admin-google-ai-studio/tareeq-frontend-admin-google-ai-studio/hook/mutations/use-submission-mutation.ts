"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { AuthenticatedUser } from "@/lib/api-client/auth";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { submissionApi, type Submission, type SubmissionResource, type SubmissionStatusUpdateRequest } from "@/lib/api-client/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";

/** An in-flight completion after logout must not recreate private cache entries. */
export async function cacheSubmissionUpdate(client: QueryClient, resource: SubmissionResource, record: Submission, userId: string | undefined) {
  if (!userId || client.getQueryState(queryKeys.session)?.status !== "success" || client.getQueryData<AuthenticatedUser>(queryKeys.session)?.id !== userId) return;
  client.setQueryData(queryKeys.admin.submissions.detail(resource, record.id), record);
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.admin.submissions.lists(resource) }),
    client.invalidateQueries({ queryKey: queryKeys.admin.submissions.detail(resource, record.id) }),
  ]);
}

export function useSubmissionMutation(resource: SubmissionResource, id: string) {
  const client = useQueryClient();
  const access = useAdminAccess();
  return useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (input: SubmissionStatusUpdateRequest) => {
      if (access.mockEnabled || !access.user) throw new Error("An authenticated real session is required.");
      try { return await submissionApi.update(resource, id, input); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
    onSuccess: (record) => cacheSubmissionUpdate(client, resource, record, access.user?.id),
  });
}
