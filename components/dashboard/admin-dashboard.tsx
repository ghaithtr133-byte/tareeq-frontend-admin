"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { isForbiddenSessionError, isUnauthenticatedSessionError } from "@/api/auth";
import { normalizeApiError } from "@/api/error";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { AdminShell } from "@/components/layout/admin-shell";
import { useLogoutMutation } from "@/hook/mutations/use-logout-mutation";
import { useSessionQuery } from "@/hook/queries/use-session-query";

export function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const logoutMutation = useLogoutMutation();
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
      await logoutMutation.mutateAsync();
      router.replace("/admin/login");
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") {
        setLogoutError(normalized.kind === "network" ? "تعذّر الاتصال بالخادم. حاول مرة أخرى." : "تعذّر تسجيل الخروج. حاول مرة أخرى.");
      }
    }
  }

  if (session.isPending || unauthenticated) return <LoadingState />;

  if (session.isError) {
    if (isForbiddenSessionError(session.error)) return <UnauthorizedState />;
    return <ErrorState action={<button type="button" onClick={() => void session.refetch()} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white">إعادة المحاولة</button>} />;
  }

  if (!session.data) return <LoadingState />;

  return (
    <AdminShell user={session.data} title="لوحة التحكم" onLogout={() => void handleLogout()} isLoggingOut={logoutMutation.isPending}>
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-[var(--gold)]">مساحة الإدارة</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--navy)]">مرحبًا، {session.data.name}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">يمكنك استخدام التنقل الجانبي للوصول إلى الأقسام التي ستتوفر ضمن المهام المعتمدة القادمة.</p>
        {logoutError ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{logoutError}</p> : null}
      </section>
    </AdminShell>
  );
}
