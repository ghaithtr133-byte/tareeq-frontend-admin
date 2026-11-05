"use client";
import { useQuery } from "@tanstack/react-query";
import { faqApi, loadFaqOrder } from "@/api/faqs";
import { queryKeys } from "@/api/query-keys";
import { normalizeApiError } from "@/api/error";
import { faqGroupSchema, type FaqGroup, type FaqListParams, type FaqScope } from "@/lib/faq-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { useContentList } from "@/hook/queries/use-content-queries";
export function useFaqList(params: FaqListParams) {
  const access = useAdminAccess();
  return useQuery({ queryKey: queryKeys.admin.faqs.list(params), enabled: !access.mockEnabled && Boolean(access.user) && faqGroupSchema.safeParse({ scope: params.scope, parentId: params.parentId }).success, retry: false,
    queryFn: async ({ signal }) => { try { return await faqApi.list(params, signal); } catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; } },
  });
}
export function useFaqOrder(group: FaqGroup) {
  const access = useAdminAccess();
  return useQuery({ queryKey: [...queryKeys.admin.faqs.group(group), "order"], enabled: !access.mockEnabled && Boolean(access.user) && faqGroupSchema.safeParse(group).success, retry: false, refetchOnMount: "always", refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => { try { return await loadFaqOrder(group, signal); } catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; } },
  });
}
export const faqParentResources = { COUNTRY: "countries", UNIVERSITY: "universities", SERVICE: "services", SCHOLARSHIP: "scholarships" } as const;
export function useFaqParents(scope: FaqScope, page: number, search: string) {
  const access = useAdminAccess(); const resource = scope === "GLOBAL" ? "countries" : faqParentResources[scope];
  return useContentList(resource, { page, limit: 50, ...(scope !== "SERVICE" && search.trim() ? { search: search.trim() } : {}) }, scope !== "GLOBAL" && Boolean(access.user) && !access.mockEnabled);
}
