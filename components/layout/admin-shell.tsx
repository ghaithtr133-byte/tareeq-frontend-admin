"use client";

import { useEffect, useId, useRef, useState } from "react";

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

function NavigationIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-3 size-5" aria-hidden="true"><path d="M5 5h14M5 12h14M5 19h14" strokeLinecap="round" /></svg>;
}

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
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!active}
                  onClick={onNavigate}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-right text-sm transition ${active ? "bg-white/12 font-bold text-white" : "cursor-not-allowed text-slate-400"}`}
                  title={active ? undefined : "هذه الصفحة ستتوفر ضمن مهمة لاحقة"}
                >
                  <NavigationIcon />
                  {item.label}
                  {!active ? <span className="mr-auto text-[10px] text-slate-500">قريبًا</span> : null}
                </button>
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
        <header className="flex min-h-18 items-center justify-between border-b border-[var(--line)] bg-white px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <button ref={menuButtonRef} type="button" className="grid size-10 place-items-center rounded-lg border border-[var(--line)] text-xl lg:hidden" aria-label="فتح قائمة التنقل" aria-expanded={drawerOpen} aria-controls={dialogId} onClick={() => setDrawerOpen(true)}><MenuIcon /></button>
            <h1 className="text-lg font-bold text-[var(--navy)] sm:text-xl">{title}</h1>
          </div>
          <div className="max-w-40 text-left sm:max-w-none">
            <p className="truncate text-sm font-semibold text-[var(--navy)]">{user.name}</p>
            <p dir="ltr" className="truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <button type="button" onClick={onLogout} disabled={isLoggingOut} className="mr-3 shrink-0 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--navy)] transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
            {isLoggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
          </button>
        </header>
        <main className="p-4 sm:p-7">{children}</main>
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
