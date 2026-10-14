"use client";

import { useEffect, useId, useRef, useState } from "react";

import { navigationForRole, type AdminNavigationId, type AuthenticatedAdmin } from "@/lib/admin";

type AdminShellProps = {
  user: AuthenticatedAdmin;
  title: string;
  activeItem?: AdminNavigationId;
  children: React.ReactNode;
};

function MenuIcon({ open = false }: { open?: boolean }) {
  return open ? <span aria-hidden="true">×</span> : <span aria-hidden="true">☰</span>;
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
                  <span className="ml-3 inline-flex size-5 items-center justify-center rounded border border-current/30 text-[10px]" aria-hidden="true">•</span>
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

export function AdminShell({ user, title, activeItem = "dashboard", children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
    if (!drawerOpen) menuButtonRef.current?.focus();
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
            <p className="truncate text-sm font-semibold text-[var(--navy)]">{user.name ?? "حساب إداري"}</p>
            {user.email ? <p dir="ltr" className="truncate text-xs text-[var(--muted)]">{user.email}</p> : null}
          </div>
        </header>
        <main className="p-4 sm:p-7">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="قائمة التنقل" id={dialogId}>
          <button className="absolute inset-0 cursor-default bg-slate-950/35" aria-label="إغلاق قائمة التنقل" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-72 shadow-2xl"><Sidebar user={user} activeItem={activeItem} onNavigate={() => setDrawerOpen(false)} /></div>
        </div>
      ) : null}
    </div>
  );
}
