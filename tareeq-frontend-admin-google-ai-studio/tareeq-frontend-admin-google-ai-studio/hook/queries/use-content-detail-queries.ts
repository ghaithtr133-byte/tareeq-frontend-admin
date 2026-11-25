"use client";

import { useQuery } from "@tanstack/react-query";

import { contentDetailApi } from "@/lib/api-client/content-details";
import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import type { DetailKind, DetailResource } from "@/lib/content-detail-schemas";
import { uuidSchema } from "@/lib/university-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function useContentDetailItems(resource: DetailResource, parentId: string, kind: DetailKind) {
  const access = useAdminAccess();
  return useQuery({
    queryKey: queryKeys.admin.content.detailItemList(resource, parentId, kind),
    enabled: Boolean(access.user) && !access.mockEnabled && uuidSchema.safeParse(parentId).success,
    retry: false,
    queryFn: async ({ signal }) => {
      try { return await contentDetailApi.list(resource, parentId, kind, signal); }
      catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
    },
  });
}
