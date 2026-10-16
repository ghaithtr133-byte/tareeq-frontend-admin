"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "@/api/auth";

/** Clears every in-memory cache only after the Backend confirms logout. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    retry: false,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
