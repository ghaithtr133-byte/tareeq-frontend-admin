"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { assertSuperAdminSession, clearPrivilegedCache, isSuperAdmin } from "@/lib/privileged-access";
import { UnauthorizedState } from "@/components/dashboard/states";
/** Lives in the existing shell so cached restricted data is cleared even on an ordinary content page. */
export function SuperAdminCacheGuard() {
  const access = useAdminAccess(); const client = useQueryClient(); const id = access.user?.id; const allowed = !access.mockEnabled && isSuperAdmin(access.user?.role);
  useEffect(() => { if (!allowed) clearPrivilegedCache(client); return () => { try { assertSuperAdminSession(client, id); } catch { clearPrivilegedCache(client); } }; }, [allowed, client, id]);
  return null;
}
export function SuperAdminBoundary({ children }: { children: React.ReactNode }) {
  const access = useAdminAccess();
  if (!isSuperAdmin(access.user?.role)) return <UnauthorizedState />;
  if (access.mockEnabled) return <p>هذه الوحدات تتطلب جلسة SUPER_ADMIN حقيقية؛ لا تُعرض إحصاءات أو حسابات وهمية.</p>;
  return children;
}
