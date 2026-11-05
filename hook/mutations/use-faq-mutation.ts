"use client";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { faqApi } from "@/api/faqs";
import { normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import type { FaqCreate, FaqGroup, FaqUpdate } from "@/lib/faq-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
type FaqAction = { create: FaqCreate } | { id: string; update: FaqUpdate } | { orderedIds: string[] };
export function invalidateFaqGroup(client: Pick<QueryClient, "invalidateQueries">, group: FaqGroup) { return client.invalidateQueries({ queryKey: queryKeys.admin.faqs.group(group) }); }
export function useFaqMutation(group: FaqGroup) {
  const access = useAdminAccess(); const client = useQueryClient();
  return useMutation({ retry: false, gcTime: 0, mutationFn: async (action: FaqAction) => {
    if (access.mockEnabled || !access.user) throw new Error("An authenticated administrator session is required.");
    try { return "create" in action ? await faqApi.create(action.create) : "orderedIds" in action ? await faqApi.reorder(group, action.orderedIds) : await faqApi.update(action.id, action.update); }
    catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  }, onSuccess: () => invalidateFaqGroup(client, group) });
}
