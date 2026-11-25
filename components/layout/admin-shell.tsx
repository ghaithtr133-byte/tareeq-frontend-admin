"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  adminNavigationGroupLabels,
  getRoleLabel,
  navigationForRole,
  type AdminNavigationGroup,
  type AdminNavigationId,
  type AdminNavigationItem,
  type AuthenticatedAdmin,
} from "@/lib/admin";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  CloseIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  NavigationIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/ui/admin-icons";

type AdminShellProps = {
  user: AuthenticatedAdmin;
  title: string;
  activeItem?: AdminNavigationId;
  onLogout: () => void;
  isLoggingOut?: boolean;
  children: React.ReactNode;
};

const groupOrder: readonly AdminNavigationGroup[] = ["overview", "content", "submissions", "system"];

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin"
      className={`flex items-center gap-3 rounded-xl py-1 focus-visible:outline-offset-4 ${collapsed ? "justify-center" : ""}`}
      title="طريق أكاديمي — لوحة الإدارة"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/45 bg-white/10 text-sm font-bold text-[var(--gold-soft)]">
        ط
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-base font-bold tracking-tight text-white">طريق أكاديمي</span>
          <span className="block truncate text-[11px] font-medium text-slate-300">بوابة الإدارة</span>
        </span>
      ) : null}
    </Link>
  );
}

function Sidebar({
  user,
  activeItem,
  collapsed = false,
  onNavigate,
}: Pick<AdminShellProps, "user" | "activeItem"> & {
  collapsed?: boolean;
  onNavigate: () => void;
}) {
  const items = navigationForRole(user.role);
  const groupedItems = useMemo(() => {
    const map = new Map<AdminNavigationGroup, AdminNavigationItem[]>();
    for (const group of groupOrder) map.set(group, []);
    for (const item of items) {
      map.get(item.group)?.push(item);
    }
    return groupOrder
      .map((group) => ({ group, label: adminNavigationGroupLabels[group], items: map.get(group) ?? [] }))
      .filter((section) => section.items.length > 0);
  }, [items]);

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden bg-[var(--navy)] text-white transition-[width] duration-200 ${collapsed ? "w-[76px] px-2.5 py-5" : "w-68 px-3.5 py-5"}`}
      aria-label="التنقل الإداري"
    >
      <div className={`shrink-0 border-b border-white/10 pb-4 ${collapsed ? "px-0.5" : "px-2"}`}>
        <BrandMark collapsed={collapsed} />
      </div>

      <nav className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pl-0.5" aria-label="الأقسام">
        {groupedItems.map((section) => (
          <div key={section.group}>
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold text-slate-400">{section.label}</p>
            ) : (
              <div className="mx-3 mb-2 border-t border-white/10 first:hidden" aria-hidden="true" />
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = item.id === activeItem;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center rounded-xl text-sm transition-colors duration-150 ${
                        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                      } ${
                        active
                          ? "bg-white/14 font-semibold text-white shadow-xs ring-1 ring-white/15"
                          : "font-medium text-slate-200 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <NavigationIcon
                        item={item.id}
                        className={`size-[18px] shrink-0 transition-colors ${
                          active ? "text-[var(--gold-soft)]" : "text-slate-300 group-hover:text-white"
                        }`}
                      />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={`mt-4 shrink-0 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 ${
          collapsed ? "flex justify-center p-2.5" : "px-3 py-2.5"
        }`}
        title={`الدور المعتمد من الخادم: ${user.role}`}
      >
        {collapsed ? (
          <ShieldCheckIcon className="size-4 text-[var(--gold-soft)]" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-300">{getRoleLabel(user.role)}</span>
            <span dir="ltr" className="font-mono text-[11px] font-medium text-white/90">
              {user.role}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

export function AdminShell({
  user,
  title,
  activeItem = "dashboard",
  onLogout,
  isLoggingOut = false,
  children,
}: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const profileDialogRef = useRef<HTMLDialogElement>(null);
  const accountMenuContainerRef = useRef<HTMLDivElement>(null);

  const dialogId = useId();
  const accountMenuId = useId();
  const profileTitleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setAccountMenuOpen(false);
      }
    }
    function onResize() {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (
        accountMenuOpen &&
        accountMenuContainerRef.current &&
        !accountMenuContainerRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const dialog = drawerRef.current;
    const opener = menuButtonRef.current;
    dialog?.showModal();
    closeButtonRef.current?.focus();
    return () => {
      dialog?.close();
      if (opener?.isConnected && opener.getClientRects().length) opener.focus();
    };
  }, [drawerOpen]);

  useEffect(() => {
    const dialog = profileDialogRef.current;
    if (!dialog) return;
    if (profileDialogOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [profileDialogOpen]);

  const roleLabel = getRoleLabel(user.role);

  return (
    <div
      className={`min-h-dvh bg-[var(--background)] lg:grid ${
        sidebarCollapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"
      }`}
    >
      <div className="hidden lg:block lg:bg-[var(--navy)]">
        <div className="lg:sticky lg:top-0 lg:h-dvh">
          <Sidebar
            user={user}
            activeItem={activeItem}
            collapsed={sidebarCollapsed}
            onNavigate={() => undefined}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-white text-[var(--navy)] transition-colors hover:bg-slate-50 lg:hidden"
              aria-label="فتح قائمة التنقل"
              aria-expanded={drawerOpen}
              aria-controls={dialogId}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="hidden size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-white text-[var(--muted)] transition-colors hover:bg-slate-50 hover:text-[var(--navy)] lg:grid"
              aria-label={sidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
            >
              {sidebarCollapsed ? (
                <PanelRightOpenIcon className="size-[18px]" />
              ) : (
                <PanelRightCloseIcon className="size-[18px]" />
              )}
            </button>

            <div className="min-w-0">
              {activeItem !== "dashboard" ? (
                <div className="hidden items-center gap-1.5 text-xs text-[var(--muted)] sm:flex">
                  <Link href="/admin" className="hover:text-[var(--navy)] hover:underline">
                    لوحة التحكم
                  </Link>
                  <ChevronLeftIcon className="size-3.5" />
                  <span className="truncate">{title}</span>
                </div>
              ) : null}
              <h1 className="truncate text-base font-bold text-[var(--navy)] sm:text-lg">{title}</h1>
            </div>
          </div>

          <div ref={accountMenuContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-controls={accountMenuId}
              aria-label={`قائمة الحساب: ${user.name}`}
              className="flex h-11 items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1.5 text-right transition-colors hover:border-[var(--line-strong)] hover:bg-slate-50"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-[var(--gold-soft)] ring-1 ring-[var(--gold)]/30"
                aria-hidden="true"
              >
                <UserIcon className="size-4" />
              </span>
              <span className="hidden min-w-0 max-w-36 sm:block">
                <span className="block truncate text-xs font-bold text-[var(--navy)]">{user.name}</span>
                <span className="block truncate text-[11px] text-[var(--muted)]">{roleLabel}</span>
              </span>
              <ChevronDownIcon
                className={`size-4 shrink-0 text-[var(--muted)] transition-transform duration-150 ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen ? (
              <div
                id={accountMenuId}
                role="menu"
                aria-label="خيارات الحساب"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-72 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-[var(--shadow-dropdown)]"
              >
                <div className="border-b border-[var(--line)] px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-[var(--navy)]">{user.name}</p>
                  <p dir="ltr" className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[var(--gold-dark)]">{roleLabel}</p>
                </div>

                <div className="py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setProfileDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-sm font-medium text-[var(--navy)] transition-colors hover:bg-slate-50"
                  >
                    <UserIcon className="size-4 shrink-0 text-[var(--muted)]" />
                    <span>إعدادات الملف الشخصي</span>
                  </button>

                  <Link
                    href="/admin/change-password"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-sm font-medium text-[var(--navy)] transition-colors hover:bg-slate-50"
                  >
                    <KeyRoundIcon className="size-4 shrink-0 text-[var(--muted)]" />
                    <span>تغيير كلمة المرور</span>
                  </Link>
                </div>

                <div className="border-t border-[var(--line)] pt-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <LogOutIcon className="size-4 shrink-0" />
                    <span>{isLoggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-clip p-4 sm:p-6 lg:p-7">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      {drawerOpen ? (
        <dialog
          ref={drawerRef}
          role="dialog"
          className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 backdrop:bg-slate-950/45 lg:hidden"
          aria-modal="true"
          aria-label="قائمة التنقل"
          id={dialogId}
          onCancel={(event) => {
            event.preventDefault();
            setDrawerOpen(false);
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 cursor-default"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-72 shadow-2xl">
            <button
              ref={closeButtonRef}
              type="button"
              className="absolute left-3.5 top-4 z-10 grid size-9 place-items-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/10"
              aria-label="إغلاق قائمة التنقل"
              onClick={() => setDrawerOpen(false)}
            >
              <CloseIcon className="size-4" />
            </button>
            <Sidebar user={user} activeItem={activeItem} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </dialog>
      ) : null}

      <dialog
        ref={profileDialogRef}
        aria-labelledby={profileTitleId}
        onCancel={(event) => {
          event.preventDefault();
          setProfileDialogOpen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--line)] bg-white p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-slate-950/45"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--navy)] text-[var(--gold-soft)]">
              <UserIcon className="size-5" />
            </span>
            <div>
              <h2 id={profileTitleId} className="text-base font-bold text-[var(--navy)]">
                إعدادات الملف الشخصي
              </h2>
              <p className="text-xs text-[var(--muted)]">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProfileDialogOpen(false)}
            className="grid size-9 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] transition-colors hover:bg-slate-50 hover:text-[var(--navy)]"
            aria-label="إغلاق إعدادات الملف الشخصي"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="profile-name-preview" className="block text-sm font-semibold text-[var(--navy)]">
              الاسم الظاهر
            </label>
            <input
              id="profile-name-preview"
              type="text"
              defaultValue={user.name}
              disabled
              className="mt-1.5 h-11 w-full cursor-not-allowed rounded-xl border border-[var(--line)] bg-slate-50 px-3.5 text-sm text-slate-600"
            />
            <p className="mt-1.5 text-xs text-[var(--gold-dark)]">
              تصميم مبدئي — تعديل الاسم بانتظار ربط الخادم (PENDING BACKEND/CODEX).
            </p>
          </div>

          <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--muted)]">البريد الإلكتروني</span>
              <span dir="ltr" className="font-mono font-medium text-[var(--navy)]">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
              <span className="text-[var(--muted)]">الصلاحية المعتمدة</span>
              <span dir="ltr" className="font-mono font-semibold text-[var(--navy)]">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <Link
              href="/admin/change-password"
              onClick={() => setProfileDialogOpen(false)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-slate-50"
            >
              <KeyRoundIcon className="size-4 text-[var(--gold-dark)]" />
              <span>تغيير كلمة المرور</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="h-10 cursor-not-allowed rounded-xl bg-[var(--navy)]/40 px-4 text-xs font-bold text-white"
              >
                حفظ التغييرات (قريبًا)
              </button>
              <button
                type="button"
                onClick={() => setProfileDialogOpen(false)}
                className="h-10 rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-slate-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
