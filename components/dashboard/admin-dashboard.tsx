"use client";

import Link from "next/link";

import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import {
  ChevronLeftIcon,
  NavigationIcon,
  PlusIcon,
} from "@/components/ui/admin-icons";
import {
  adminNavigationGroupLabels,
  getRoleLabel,
  navigationForRole,
  type AdminNavigationGroup,
  type AdminNavigationItem,
} from "@/lib/admin";
import { useAdminAccess } from "@/providers/admin-access-provider";

export const dashboardQuickActions = [
  { resource: "countries", label: "إضافة دولة", href: "/admin/countries/new", icon: "countries" },
  { resource: "universities", label: "إضافة جامعة", href: "/admin/universities/new", icon: "universities" },
  { resource: "scholarships", label: "إضافة منحة دراسية", href: "/admin/scholarships/new", icon: "scholarships" },
  { resource: "articles", label: "كتابة مقال", href: "/admin/articles/new", icon: "articles" },
] as const;

const workflowGroupOrder: readonly Exclude<AdminNavigationGroup, "overview">[] = [
  "submissions",
  "content",
  "system",
];

export function AdminDashboard() {
  const access = useAdminAccess();
  const user = access.user;
  const hasAdminRole = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const allowedQuickActions = hasAdminRole ? dashboardQuickActions : [];

  const navigationItems = user ? navigationForRole(user.role) : [];
  const workflowSections = workflowGroupOrder
    .map((group) => ({
      group,
      label: adminNavigationGroupLabels[group],
      items: navigationItems.filter((item): item is AdminNavigationItem => item.group === group && !item.disabled),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <AdminProtectedShell title="لوحة التحكم" activeItem="dashboard">
      <div className="space-y-7">
        {/* Welcome / Orientation Header */}
        <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-semibold text-[var(--gold-dark)]">
                مساحة الإدارة {user ? `· ${getRoleLabel(user.role)}` : ""}
              </p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.7rem]">
                {user ? `مرحبًا، ${user.name}` : "مرحبًا بك في مساحة الإدارة"}
              </h2>
              <p className="mt-2.5 text-sm leading-7 text-[var(--muted)]">
                بوابة موحدة لإدارة المحتوى الأكاديمي ومتابعة طلبات التقديم والاستفسارات الواردة عبر موقع طريق أكاديمي.
              </p>
            </div>

            {hasAdminRole ? (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href="/admin/applications"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--navy-light)]"
                >
                  <span>متابعة الطلبات</span>
                  <ChevronLeftIcon className="size-4 text-[var(--gold-soft)]" />
                </Link>
                <Link
                  href="/admin/inquiries"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50"
                >
                  الاستفسارات
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {/* Quick Create Actions */}
        {allowedQuickActions.length ? (
          <section aria-labelledby="quick-actions-heading" className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[var(--gold-dark)]">اختصارات الإنشاء</p>
                <h2 id="quick-actions-heading" className="mt-0.5 text-base font-bold text-[var(--navy)]">
                  إجراء سريع
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {allowedQuickActions.map((action) => (
                <Link
                  key={action.resource}
                  href={action.href}
                  className="group flex min-h-14 items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--navy)] shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/35"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-[var(--gold-soft)] transition-colors group-hover:bg-[var(--navy-light)]">
                      <NavigationIcon item={action.icon} className="size-4" />
                    </span>
                    <span className="whitespace-nowrap">{action.label}</span>
                  </span>
                  <PlusIcon className="size-3.5 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--gold-dark)]" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Grouped Administrative Workflow Cards */}
        {workflowSections.map((section) => {
          const gridClass =
            section.items.length === 2
              ? "grid gap-3.5 sm:grid-cols-2"
              : section.items.length === 8 || section.items.length === 4
                ? "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
                : "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3";

          return (
            <section
              key={section.group}
              aria-labelledby={`workflow-group-${section.group}`}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                <h2
                  id={`workflow-group-${section.group}`}
                  className="text-base font-bold text-[var(--navy)]"
                >
                  {section.label}
                </h2>
                {section.group === "system" ? (
                  <span className="text-xs font-medium text-[var(--gold-dark)]">صلاحيات مدير النظام</span>
                ) : null}
              </div>

              <div className={gridClass}>
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-start gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--gold)] hover:bg-white"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--background)] text-[var(--navy)] transition-colors group-hover:border-[var(--gold)]/45 group-hover:bg-[var(--gold-soft)]">
                      <NavigationIcon item={item.id} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-[var(--navy)]">{item.label}</h3>
                        <ChevronLeftIcon className="size-4 shrink-0 text-[var(--muted)] transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:text-[var(--gold-dark)]" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AdminProtectedShell>
  );
}
