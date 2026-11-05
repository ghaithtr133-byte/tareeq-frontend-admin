"use client";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { phase4Api } from "@/api/phase4";
import { normalizeApiError } from "@/api/error";
import { queryKeys } from "@/api/query-keys";
import { assertSuperAdminSession } from "@/lib/privileged-access";
import type { AccountUpdate, ManagedAccount } from "@/lib/phase4-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
export function invalidateAccountChange(client: QueryClient, actorId: string) { return Promise.all([client.invalidateQueries({ queryKey: queryKeys.admin.privileged.accounts(actorId) }), client.invalidateQueries({ queryKey: queryKeys.admin.privileged.audit(actorId) })]); }
export async function cacheAccountUpdate(client: QueryClient, actorId: string | undefined, record: ManagedAccount) {
  try { assertSuperAdminSession(client, actorId); } catch { return; }
  client.setQueriesData<Awaited<ReturnType<typeof phase4Api.accounts>>>({ queryKey: queryKeys.admin.privileged.accounts(actorId!) }, old => old ? { ...old, items: old.items.map(item => item.id === record.id ? record : item) } : old);
  await invalidateAccountChange(client, actorId!);
}
export function useAccountMutation() {
  const access = useAdminAccess(); const client = useQueryClient(); const actorId = access.user?.id;
  return useMutation({ mutationKey: [...queryKeys.admin.privileged.user(actorId ?? "missing"), "account-update"], gcTime: 0, retry: false, mutationFn: async ({ id, input }: { id: string; input: AccountUpdate }) => {
    if (access.mockEnabled) throw new Error("Real SUPER_ADMIN session required."); assertSuperAdminSession(client, actorId);
    try { const result = await phase4Api.updateAccount(id, input); assertSuperAdminSession(client, actorId); return result; }
    catch (error) { const status = normalizeApiError(error).status; if (status === 401) access.reportContentUnauthorized(); else if (status === 403) void access.refetchSession(); throw error; }
  }, onSuccess: record => cacheAccountUpdate(client, actorId, record) });
}
