"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  assertSuperAdminSession,
  clearPrivilegedCache,
  isSuperAdmin,
} from "@/lib/privileged-access";
import { UnauthorizedState } from "@/components/dashboard/states";
import { ShieldCheckIcon } from "@/components/ui/admin-icons";

/** Lives in the existing shell so cached restricted data is cleared even on an ordinary content page. */
export function SuperAdminCacheGuard() {
  const access = useAdminAccess();
  const client = useQueryClient();
  const id = access.user?.id;
  const allowed = !access.mockEnabled && isSuperAdmin(access.user?.role);

  useEffect(() => {
    if (!allowed) clearPrivilegedCache(client);
    return () => {
      try {
        assertSuperAdminSession(client, id);
      } catch {
        clearPrivilegedCache(client);
      }
    };
  }, [allowed, client, id]);

  return null;
}

export function SuperAdminBoundary({ children }: { children: React.ReactNode }) {
  const access = useAdminAccess();

  if (!isSuperAdmin(access.user?.role)) {
    return <UnauthorizedState />;
  }

  if (access.mockEnabled) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-dark)]">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--navy)]">
              وحدة محصورة بصلاحية المشرف العام (SUPER_ADMIN)
            </h3>
            <p className="text-sm text-[var(--muted)]">
              هذه الوحدات تتطلب جلسة SUPER_ADMIN حقيقية متصلة بالخادم؛ لا تُعرض بيانات أو إحصاءات أو حسابات وهمية في وضع المعاينة المحلية.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
