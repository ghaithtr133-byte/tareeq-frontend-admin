"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import { navigationForRole, type AdminNavigationId, type AuthenticatedAdmin } from "@/lib/admin";

type AdminShellProps = {
  user: AuthenticatedAdmin;
  title: string;
  activeItem?: AdminNavigationId;
  onLogout: () => void;
  isLoggingOut?: boolean;
  children: React.ReactNode;
};

function MenuIcon({ open = false }: { open?: boolean }) {
  return open ? <span aria-hidden="true">×</span> : <span aria-hidden="true">☰</span>;
}

function NavigationIcon({ item }: { item: AdminNavigationId }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", className: "ml-3 size-5 shrink-0", "aria-hidden": true as const };
  if (item === "dashboard") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  if (item === "applications") return <svg {...common}><path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5" /></svg>;
  if (item === "inquiries") return <svg {...common}><path d="M5 5h14v10H9l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></svg>;
  if (item === "countries") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8S14.2 17.8 12 20M12 4c-2.2 2.2-3.3 4.9-3.3 8S9.8 17.8 12 20" /></svg>;
  if (item === "universities") return <svg {...common}><path d="m3 9 9-5 9 5-9 5-9-5ZM5 11v6m4-4v5m6-5v5m4-7v6M4 20h16" /></svg>;
  if (item === "scholarships") return <svg {...common}><path d="m3 9 9-5 9 5-9 5-9-5ZM7 12v4c2.5 2 7.5 2 10 0v-4" /></svg>;
  if (item === "services") return <svg {...common}><path d="M4 7h16M7 4v6m10-6v6M6 11h12v9H6z" /></svg>;
  if (item === "articles") return <svg {...common}><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6" /></svg>;
  if (item === "media") return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m6 17 4-4 3 3 2-2 3 3" /></svg>;
  if (item === "analytics") return <svg {...common}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>;
  if (item === "audit-log") return <svg {...common}><path d="M12 5v7l4 2" /><circle cx="12" cy="12" r="8" /></svg>;
  if (item === "admins") return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.4 3-5 7-5s6.4 1.6 7 5" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 3v3m0 12v3M21 12h-3M6 12H3m15.4-6.4-2.1 2.1M7.7 16.3l-2.1 2.1m12.8 0-2.1-2.1M7.7 7.7 5.6 5.6" /></svg>;
}

const contentRoutes: Partial<Record<AdminNavigationId, string>> = {
  dashboard: "/admin",
  countries: "/admin/countries",
  universities: "/admin/universities",
  scholarships: "/admin/scholarships",
  services: "/admin/services",
  articles: "/admin/articles",
};

function Sidebar({ user, activeItem, onNavigate }: Pick<AdminShellProps, "user" | "activeItem"> & { onNavigate: () => void }) {
  return (
    <aside className="flex h-full w-72 flex-col bg-[var(--navy)] px-4 py-5 text-white" aria-label="التنقل الإداري">
      <div className="border-b border-white/10 px-3 pb-5">
        <p className="text-lg font-bold">طريق أكاديمي</p>
        <p className="mt-1 text-xs text-slate-300">إدارة المنصة · هوية مؤقتة</p>
      </div>
      <nav className="mt-5 flex-1" aria-label="الأقسام">
        <p className="px-3 text-xs font-semibold tracking-wide text-slate-400">مساحة العمل</p>
        <ul className="mt-2 space-y-1">
          {navigationForRole(user.role).map((item) => {
            const active = item.id === activeItem;
            const href = contentRoutes[item.id];
            return (
              <li key={item.id}>
                {href ? (
                  <Link href={href} onClick={onNavigate} className={`flex w-full items-center rounded-lg px-3 py-2.5 text-right text-sm transition ${active ? "bg-white/12 font-bold text-white" : "text-slate-200 hover:bg-white/8 hover:text-white"}`} aria-current={active ? "page" : undefined}>
                    <NavigationIcon item={item.id} />{item.label}
                  </Link>
                ) : (
                  <button type="button" disabled className="flex w-full cursor-not-allowed items-center rounded-lg px-3 py-2.5 text-right text-sm text-slate-400" title="هذه الصفحة غير متاحة ضمن النطاق الحالي">
                    <NavigationIcon item={item.id} />{item.label}<span className="mr-auto text-[10px] text-slate-500">قريبًا</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
        الدور المعتمد من الخادم: <span className="font-semibold text-white">{user.role}</span>
      </div>
    </aside>
  );
}

export function AdminShell({ user, title, activeItem = "dashboard", onLogout, isLoggingOut = false, children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (drawerOpen) closeButtonRef.current?.focus();
    else menuButtonRef.current?.focus();
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="hidden lg:block"><Sidebar user={user} activeItem={activeItem} onNavigate={() => undefined} /></div>
      <div className="min-w-0">
        <header className="flex min-h-18 items-center justify-between gap-2 border-b border-[var(--line)] bg-white px-4 py-3 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButtonRef} type="button" className="grid size-10 place-items-center rounded-lg border border-[var(--line)] text-xl lg:hidden" aria-label="فتح قائمة التنقل" aria-expanded={drawerOpen} aria-controls={dialogId} onClick={() => setDrawerOpen(true)}><MenuIcon /></button>
            <h1 className="truncate text-lg font-bold text-[var(--navy)] sm:text-xl">{title}</h1>
          </div>
          <div className="min-w-0 max-w-28 text-left sm:max-w-none sm:shrink-0" title={`${user.name} — ${user.email}`} aria-label={`الحساب الحالي: ${user.name}، ${user.email}`}>
            <p className="truncate text-sm font-semibold text-[var(--navy)]">{user.name}</p>
            <p className="text-xs text-[var(--muted)] sm:hidden">{user.role === "SUPER_ADMIN" ? "مدير" : "مشرف"}</p>
            <p dir="ltr" className="hidden truncate text-xs text-[var(--muted)] sm:block">{user.email}</p>
          </div>
          <button type="button" onClick={onLogout} disabled={isLoggingOut} className="mr-3 shrink-0 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--navy)] transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
            {isLoggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
          </button>
        </header>
        <main className="min-w-0 overflow-x-hidden p-4 sm:p-7">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="قائمة التنقل" id={dialogId}>
          <button className="absolute inset-0 cursor-default bg-slate-950/35" aria-label="إغلاق قائمة التنقل" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-72 shadow-2xl">
            <button ref={closeButtonRef} type="button" className="absolute left-4 top-4 z-10 grid size-9 place-items-center rounded-lg border border-white/20 text-lg text-white hover:bg-white/10" aria-label="إغلاق قائمة التنقل" onClick={() => setDrawerOpen(false)}><MenuIcon open /></button>
            <Sidebar user={user} activeItem={activeItem} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
