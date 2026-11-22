"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useManagedAccounts } from "@/hook/queries/use-phase4-queries";
import { useAccountMutation } from "@/hook/mutations/use-account-mutation";
import { managedRoleLabels } from "@/lib/content-labels";
import { accountUpdateSchema, managedRoles, type ManagedAccount } from "@/lib/phase4-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  BanIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  KeyRoundIcon,
  MailIcon,
  PencilIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserIcon,
} from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  PageControls,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import { Phase4Error } from "./query-state";

function AccountCard({ record }: { record: ManagedAccount }) {
  const access = useAdminAccess();
  const own = access.user?.id === record.id;
  const mutation = useAccountMutation();
  const [editing, setEditing] = useState<ManagedAccount>();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [roleError, setRoleError] = useState("");
  const form = useForm<{ role: ManagedAccount["role"] }>({
    defaultValues: { role: record.role },
  });

  async function update(input: { role: ManagedAccount["role"] } | { isActive: boolean }) {
    if (mutation.isPending) return;
    setMessage("");
    setIsSuccess(false);
    setRoleError("");
    try {
      const result = await mutation.mutateAsync({
        id: record.id,
        input: accountUpdateSchema.parse(input),
      });
      form.reset({ role: result.role });
      setEditing(undefined);
      setIsSuccess(true);
      setMessage("تم تحديث الحساب وفق استجابة الخادم.");
    } catch (error) {
      const normalized = normalizeApiError(error);
      setRoleError(getApiFieldErrors(error).role?.[0] ?? "");
      if (normalized.kind !== "cancelled") {
        setIsSuccess(false);
        setMessage(
          normalized.status === 409
            ? "رفض الخادم التغيير لحماية الحساب الحالي أو آخر SUPER_ADMIN نشط أو لعدم وجود تغيير. احتُفظ باختيارك؛ أعد تحميل البيانات قبل المحاولة."
            : normalized.status === 403
              ? "رفض الخادم التغيير. تحقق من الصلاحيات والأصل الموثوق؛ لم يتغير العرض إلى نجاح."
              : normalized.status === 401
                ? "تعذّر التحديث بسبب صلاحية الجلسة."
                : "تعذّر تحديث الحساب. احتُفظ بالاختيار ولم يُعاد الطلب تلقائيًا.",
        );
      }
    }
  }

  const stale = Boolean(editing && (editing.role !== record.role || editing.isActive !== record.isActive));
  const selectedRole = useWatch({ control: form.control, name: "role" });

  return (
    <article className={panelClass}>
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-subtle)] text-[var(--navy)]">
            <UserIcon className="size-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-bold text-[var(--navy)]">{record.name}</h3>
              {own ? (
                <span className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold-soft)]/60 px-2 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
                  حسابك الحالي
                </span>
              ) : null}
            </div>
            <p className="flex items-center gap-1.5 break-all text-xs text-[var(--muted)]" dir="ltr">
              <MailIcon className="size-3.5 shrink-0" />
              <span>{record.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold whitespace-nowrap ${
              record.role === "SUPER_ADMIN"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-slate-50 text-[var(--navy)]"
            }`}
          >
            <ShieldCheckIcon className="size-3.5" />
            <span>{record.role === "SUPER_ADMIN" ? "مشرف عام" : "مشرف"}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold whitespace-nowrap ${
              record.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {record.isActive ? (
              <CheckCircleIcon className="size-3.5" />
            ) : (
              <BanIcon className="size-3.5" />
            )}
            <span>{record.isActive ? "نشط" : "معطّل"}</span>
          </span>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span>
          الدور الحالي: <strong className="text-[var(--navy)]">{managedRoleLabels[record.role]}</strong>
        </span>
        <span className="font-mono text-[11px] break-all" dir="ltr">
          {record.id}
        </span>
      </div>

      {own ? (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--muted)]">
          حماية الحساب الحالي: لا يسمح العقد بخفض دورك أو إلغاء تفعيل حسابك أثناء تسجيل الدخول.
        </p>
      ) : null}

      {/* Inline Role Editor */}
      {editing ? (
        <form
          className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5"
          onSubmit={form.handleSubmit((values) => {
            if (
              mutation.isPending ||
              stale ||
              values.role === record.role ||
              (own && values.role === "ADMIN")
            ) {
              return;
            }
            if (!window.confirm(`تأكيد تغيير دور هذا الحساب إلى ${managedRoleLabels[values.role]}؟`)) {
              return;
            }
            void update({ role: values.role });
          })}
        >
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>الدور الجديد</span>
            <div className="relative">
              <select
                aria-label="الدور الجديد"
                className={`${inputClass} appearance-none pl-9`}
                disabled={mutation.isPending}
                {...form.register("role")}
              >
                {managedRoles.map((role) => (
                  <option key={role} value={role} disabled={own && role === "ADMIN"}>
                    {managedRoleLabels[role]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          {roleError ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              {roleError}
            </p>
          ) : null}
          {stale ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              تغيرت بيانات السجل. أغلق المحرر وأعد فتحه قبل الحفظ.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={mutation.isPending || stale || selectedRole === record.role}
            >
              تأكيد حفظ الدور
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={mutation.isPending}
              onClick={() => setEditing(undefined)}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}

      {/* Working Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
        {!editing ? (
          <button
            type="button"
            className={buttonClass}
            disabled={mutation.isPending || own}
            onClick={() => {
              form.reset({ role: record.role });
              setEditing(record);
              setMessage("");
            }}
          >
            <ShieldCheckIcon className="size-3.5" />
            <span>تغيير الدور</span>
          </button>
        ) : null}

        <button
          type="button"
          className={
            record.isActive
              ? "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              : primaryButtonClass
          }
          disabled={mutation.isPending || Boolean(editing) || (own && record.isActive)}
          onClick={() => {
            if (
              window.confirm(
                record.isActive
                  ? "تحذير: سيؤدي إلغاء تفعيل هذا الحساب إلى إبطال جميع جلساته النشطة فورًا ومنعه من الدخول. هل تريد المتابعة؟"
                  : "تأكيد إعادة تفعيل هذا الحساب الإداري؟",
              )
            ) {
              void update({ isActive: !record.isActive });
            }
          }}
        >
          {record.isActive ? (
            <>
              <BanIcon className="size-3.5" />
              <span>إلغاء التفعيل</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="size-3.5" />
              <span>تفعيل الحساب</span>
            </>
          )}
        </button>
      </div>

      {/* Design-Only Planned Account Operations (Pending Backend / Codex) */}
      <details className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-subtle)] p-3">
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--navy)]">
          <span>إجراءات إدارة متقدمة</span>
          <span className="font-mono text-[10px] font-bold text-amber-800">
            DESIGN ONLY · PENDING BACKEND/CODEX
          </span>
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
          واجهة مبدئية معطّلة؛ يتطلب تفعيل هذه الإجراءات تنفيذ نقاط النهاية المخصصة لها في الخادم قبل الإطلاق.
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[11px] font-semibold text-[var(--muted)] opacity-60 cursor-not-allowed"
          >
            <PencilIcon className="size-3" />
            <span>تعديل الاسم</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[11px] font-semibold text-[var(--muted)] opacity-60 cursor-not-allowed"
          >
            <MailIcon className="size-3" />
            <span>تعديل البريد</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[11px] font-semibold text-[var(--muted)] opacity-60 cursor-not-allowed"
          >
            <KeyRoundIcon className="size-3" />
            <span>إعادة تعيين كلمة المرور</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-[11px] font-semibold text-red-700/70 opacity-60 cursor-not-allowed"
          >
            <TrashIcon className="size-3" />
            <span>حذف الحساب</span>
          </button>
        </div>
      </details>

      {message ? (
        <p
          role={isSuccess ? "status" : "alert"}
          className={`break-words rounded-xl border px-3.5 py-2 text-xs font-medium ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </article>
  );
}

export function AccountsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const query = useManagedAccounts({ page, limit });

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">
            إدارة النظام · SUPER_ADMIN
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">إدارة حسابات المشرفين</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            عرض الحسابات وتعديل الدور الإداري وحالة التفعيل. حماية آخر SUPER_ADMIN نشط تُفرض في الخادم.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>حسابات لكل صفحة</span>
            <div className="relative">
              <select
                aria-label="حسابات لكل صفحة"
                className={`${inputClass} w-28 appearance-none pl-9`}
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <button
            type="button"
            className={buttonClass}
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RotateCcwIcon className="size-3.5" />
            <span>تحديث القائمة</span>
          </button>
        </div>
      </header>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <Phase4Error error={query.error} retry={query.refetch} />
      ) : !query.data || !query.data.items.length ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.items.map((record) => (
            <AccountCard key={record.id} record={record} />
          ))}
        </div>
      )}

      <PageControls data={query.data} change={setPage} />
    </section>
  );
}
