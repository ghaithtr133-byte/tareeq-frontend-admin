"use client";

import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { InfoIcon } from "@/components/ui/admin-icons";

/** TA-105: deliberately renders before any Service management component or hook. */
export function SuspendedServicesManagementPage() {
  return (
    <AdminProtectedShell title="الخدمات ملغاة" activeItem="services">
      <section
        className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-white p-6 text-center shadow-[var(--shadow-card)] sm:p-8"
        aria-labelledby="services-suspended-title"
      >
        <InfoIcon className="mx-auto size-8 text-[var(--gold-dark)]" aria-hidden="true" />
        <h2 id="services-suspended-title" className="mt-3 text-xl font-bold text-[var(--navy)]">
          إدارة الخدمات ملغاة حاليًا
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          تبقى السجلات والعلاقات التاريخية محفوظة، لكن إنشاء الخدمات أو تعديلها غير متاح في لوحة الإدارة الآن.
        </p>
      </section>
    </AdminProtectedShell>
  );
}
