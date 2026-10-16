"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getAuthenticatedUser, LoginSessionVerificationError, login, type LoginRequest } from "@/api/auth";
import { queryKeys } from "@/api/query-keys";

/**
 * A successful login is followed by /auth/me before the session cache changes;
 * the login envelope alone is never treated as proof of an active session.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    retry: false,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session });
    },
    onSuccess: async () => {
      queryClient.clear();
      try {
        const user = await getAuthenticatedUser();
        queryClient.setQueryData(queryKeys.session, user);
      } catch (error) {
        throw new LoginSessionVerificationError(error);
      }
    },
  });
}
