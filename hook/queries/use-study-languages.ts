"use client";

import { useQuery } from "@tanstack/react-query";

import { normalizeApiError } from "@/lib/api-client/error";
import { queryKeys } from "@/lib/api-client/query-keys";
import { studyLanguageCatalogApi } from "@/lib/api-client/study-languages";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function useStudyLanguageCatalog() {
  const access = useAdminAccess();

  return useQuery({
    queryKey: queryKeys.admin.studyLanguages,
    enabled: Boolean(access.user) && !access.mockEnabled,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return await studyLanguageCatalogApi.list({ signal });
      } catch (error) {
        if (normalizeApiError(error).status === 401) access.reportContentUnauthorized();
        throw error;
      }
    },
  });
}
