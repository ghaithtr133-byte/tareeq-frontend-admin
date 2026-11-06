"use client";
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "@/lib/api-client/auth";
import { queryKeys } from "@/lib/api-client/query-keys";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { clearPrivateAdminCache } from "@/lib/admin-session-cache";
import { assertContentSession, captureContentSession, type ContentSessionContext } from "@/lib/content-session";
import { ChangePasswordError, safePasswordError, type ChangePasswordRequest } from "@/lib/change-password";

export function useChangePasswordMutation() {
  const client = useQueryClient(); const access = useAdminAccess();
  const request = useRef<{ input: ChangePasswordRequest; context: ContentSessionContext } | undefined>(undefined);
  const busy = useRef(false);
  // Passwords NEVER enter TanStack variables, data or errors, even while pending.
  const mutation = useMutation<void, ChangePasswordError, void>({ gcTime: 0, retry: false, mutationKey: ["admin", "change-password"], mutationFn: async () => {
    const pending = request.current; if (!pending || access.mockEnabled) throw new ChangePasswordError("unknown");
    try {
      assertContentSession(client, pending.context);
      await changePassword(pending.input);
      assertContentSession(client, pending.context);
      await client.cancelQueries();
      assertContentSession(client, pending.context);
      clearPrivateAdminCache(client);
      client.setQueryData(queryKeys.session, null);
    } catch (error) { throw safePasswordError(error); }
  } });
  async function submit(input: ChangePasswordRequest) {
    if (busy.current || access.mockEnabled) throw new ChangePasswordError("unknown");
    busy.current = true;
    try { request.current = { input, context: captureContentSession(client, access.user?.id, false) }; await mutation.mutateAsync(); }
    finally { request.current = undefined; busy.current = false; }
  }
  return { isPending: mutation.isPending, submit };
}
