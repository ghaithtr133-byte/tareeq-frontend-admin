"use client";

import { useQuery } from "@tanstack/react-query";

import { restoreAuthenticatedUser, type AuthenticatedUser } from "@/lib/api-client/auth";
import { queryKeys } from "@/lib/api-client/query-keys";

/** The sole client-side source of authenticated-user state. */
export function useSessionQuery() {
  return useQuery<AuthenticatedUser | null>({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => restoreAuthenticatedUser({ signal }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
