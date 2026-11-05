import type { QueryClient } from "@tanstack/react-query";
import type { AuthenticatedUser } from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
export function isSuperAdmin(role: string | undefined) { return role === "SUPER_ADMIN"; }
export function assertSuperAdminSession(client: QueryClient, id: string | undefined) {
  const user = client.getQueryData<AuthenticatedUser | null>(queryKeys.session);
  if (!id || client.getQueryState(queryKeys.session)?.status !== "success" || user?.id !== id || !isSuperAdmin(user.role)) throw new Error("SUPER_ADMIN session is no longer available.");
}
/** Only Phase4 restricted data/mutations are affected; unrelated content keys remain intact. */
export function clearPrivilegedCache(client: QueryClient) {
  void client.cancelQueries({ queryKey: queryKeys.admin.privileged.root });
  client.removeQueries({ queryKey: queryKeys.admin.privileged.root });
  for (const mutation of client.getMutationCache().getAll()) if (mutation.options.mutationKey?.[0] === "admin" && mutation.options.mutationKey?.[1] === "super-admin") client.getMutationCache().remove(mutation);
}
