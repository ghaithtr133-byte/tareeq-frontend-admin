"use client";

import Link from "next/link";

import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { useAdminAccess } from "@/providers/admin-access-provider";

const quickActions = [
  { resource: "countries", label: "إضافة دولة", href: "/admin/countries/new", icon: "country" },
  { resource: "universities", label: "إضافة جامعة", href: "/admin/universities/new", icon: "university" },
  { resource: "scholarships", label: "إضافة منحة دراسية", href: "/admin/scholarships/new", icon: "scholarship" },
  { resource: "services", label: "إضافة خدمة", href: "/admin/services/new", icon: "service" },
  { resource: "articles", label: "كتابة مقال", href: "/admin/articles/new", icon: "article" },
] as const;

function QuickActionIcon({ kind }: { kind: (typeof quickActions)[number]["icon"] }) {
  if (kind === "country") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8S14.2 17.8 12 20M12 4c-2.2 2.2-3.3 4.9-3.3 8S9.8 17.8 12 20" /></svg>;
  if (kind === "university") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M5 11v6m4-4v5m6-5v5m4-7v6M4 20h16" /></svg>;
  if (kind === "scholarship") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 12v4c2.5 2 7.5 2 10 0v-4" /></svg>;
  if (kind === "service") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><path d="M4 7h16M7 4v6m10-6v6M6 11h12v9H6z" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4M9 12h6M9 16h6" /></svg>;
}

export function AdminDashboard() {
  const access = useAdminAccess();
  const allowedActions = quickActions.filter((action) => access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");

  return (
    <AdminProtectedShell title="لوحة التحكم" activeItem="dashboard">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-[var(--gold)]">مساحة الإدارة</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--navy)]">مرحبًا بك في مساحة الإدارة</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">استخدم التنقل الجانبي لإدارة الدول والجامعات والمنح والخدمات والمقالات.</p>
        </section>
        {allowedActions.length ? <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm" aria-labelledby="quick-actions-heading">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--gold)]">اختصارات الإدارة</p><h2 id="quick-actions-heading" className="mt-1 text-lg font-bold text-[var(--navy)]">إجراء سريع</h2></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {allowedActions.map((action) => <Link key={action.resource} href={action.href} className="group flex min-h-16 items-center gap-3 rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold text-[var(--navy)] transition hover:border-[var(--gold)] hover:bg-amber-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--gold)]">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-[var(--gold)]"><QuickActionIcon kind={action.icon} /></span><span>{action.label}</span>
            </Link>)}
          </div>
        </section> : null}
      </div>
    </AdminProtectedShell>
  );
}
