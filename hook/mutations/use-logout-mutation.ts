"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { clearPrivateAdminCache } from "@/lib/admin-session-cache";

/** Clear private records and retain a signed-out sentinel after confirmed logout. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session });
      clearPrivateAdminCache(queryClient);
      queryClient.setQueryData(queryKeys.session, null);
    },
  });
}
