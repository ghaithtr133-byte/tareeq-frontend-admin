"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { isForbiddenSessionError, isUnauthenticatedSessionError } from "@/api/auth";
import { normalizeApiError } from "@/api/error";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { AdminShell } from "@/components/layout/admin-shell";
import { DevAdminControls } from "@/components/layout/dev-admin-controls";
import { useAdminAccess } from "@/providers/admin-access-provider";
import type { AdminNavigationId } from "@/lib/admin";

type AdminProtectedShellProps = {
  title: string;
  activeItem: AdminNavigationId;
  children: React.ReactNode;
};

/** Browser-only session gate: Backend cookies remain inaccessible to Next.js server components. */
export function AdminProtectedShell({ title, activeItem, children }: AdminProtectedShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAdminAccess();
  const [logoutError, setLogoutError] = useState<string>();
  const unauthenticated = isUnauthenticatedSessionError(session.error);

  useEffect(() => {
    if (unauthenticated) {
      queryClient.clear();
      router.replace("/admin/login");
    }
  }, [queryClient, router, unauthenticated]);

  async function handleLogout() {
    setLogoutError(undefined);
    try {
      await session.logout();
      router.replace("/admin/login");
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") setLogoutError(normalized.kind === "network" ? "تعذّر الاتصال بالخادم. حاول مرة أخرى." : "تعذّر تسجيل الخروج. حاول مرة أخرى.");
    }
  }

  if (session.isPending || unauthenticated) return <LoadingState />;
  if (session.isError) {
    if (isForbiddenSessionError(session.error)) return <UnauthorizedState />;
    return <ErrorState action={<button type="button" onClick={() => void session.refetchSession()} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white">إعادة المحاولة</button>} />;
  }
  if (!session.user) return <LoadingState />;

  return (
    <AdminShell user={session.user} title={title} activeItem={activeItem} onLogout={() => void handleLogout()} isLoggingOut={session.isLoggingOut}>
      <DevAdminControls />
      {children}
      {logoutError ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{logoutError}</p> : null}
    </AdminShell>
  );
}
