"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hook/queries/use-phase4-queries";
import { auditParamsSchema, auditResourceTypes, type AuditParams } from "@/lib/phase4-schemas";
import { safeAuditMetadata, utcDate } from "@/lib/phase4-presentation";
import {
  auditActionLabel,
  auditResourceLabel,
  auditResourceTypeLabels,
} from "@/lib/content-labels";
import { isoFormDate } from "@/lib/university-schemas";
import {
  CalendarIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
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

export function AuditPage() {
  const [params, setParams] = useState<AuditParams>({ page: 1, limit: 20 });
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);
  const query = useAuditLogs(params);

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold text-[var(--gold-dark)]">
          الأمان والرقابة · SUPER_ADMIN
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">سجل التدقيق</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          سجل غير قابل للتعديل مرتب بالأحدث أولًا. تُعرض الحقول الوصفية المسموحة فقط لحماية البيانات الحساسة.
        </p>
      </header>

      {/* Filters Card */}
      <form
        key={formKey}
        noValidate
        className={`${panelClass} space-y-4`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const raw = Object.fromEntries(
            [...data.entries()]
              .filter(([, value]) => value !== "")
              .map(([key, value]) => [
                key,
                key === "limit"
                  ? Number(value)
                  : key === "from" || key === "to"
                    ? isoFormDate(String(value))
                    : value,
              ]),
          );
          try {
            setParams(auditParamsSchema.parse({ ...raw, page: 1 }));
            setError("");
          } catch {
            setError("تحقق من UUID المنفذ، وصيغة الإجراء والتواريخ وترتيبها وحدود الصفحة.");
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>نوع المورد</span>
            <div className="relative">
              <select
                aria-label="نوع المورد"
                name="resourceType"
                className={`${inputClass} appearance-none pl-9`}
              >
                <option value="">كل الموارد</option>
                {auditResourceTypes.map((value) => (
                  <option key={value} value={value}>
                    {auditResourceTypeLabels[value]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>الإجراء الدقيق</span>
            <input
              aria-label="الإجراء الدقيق"
              name="action"
              dir="ltr"
              maxLength={100}
              placeholder="content.country.status_changed"
              className={`${inputClass} font-mono text-xs`}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>معرّف المنفذ (UUID)</span>
            <input
              aria-label="معرّف المنفذ UUID"
              name="actorId"
              dir="ltr"
              maxLength={36}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={`${inputClass} font-mono text-xs`}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>من (وقت محلي)</span>
            <input
              aria-label="من (وقت محلي)"
              name="from"
              type="datetime-local"
              step={1}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>إلى (وقت محلي)</span>
            <input
              aria-label="إلى (وقت محلي)"
              name="to"
              type="datetime-local"
              step={1}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>سجلات لكل صفحة</span>
            <div className="relative">
              <select
                aria-label="سجلات لكل صفحة"
                name="limit"
                defaultValue={20}
                className={`${inputClass} appearance-none pl-9`}
              >
                {[20, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value} سجل
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
          <p className="text-[11px] text-[var(--muted)]">
            تُرسل حدود الوقت المختارة كـ ISO UTC شامل، دون توسيع اليوم تلقائيًا.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setParams({ page: 1, limit: 20 });
                setError("");
                setFormKey((k) => k + 1);
              }}
            >
              <RotateCcwIcon className="size-3.5" />
              <span>إعادة ضبط</span>
            </button>
            <button type="submit" className={primaryButtonClass}>
              تطبيق مرشحات السجل
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <Phase4Error error={query.error} retry={query.refetch} />
      ) : !query.data || !query.data.items.length ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {query.data.items.map((record) => {
            const metadata = safeAuditMetadata(record.metadata);
            const safeActionToken =
              record.action.length <= 100 &&
              /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$/.test(record.action)
                ? record.action
                : "معرّف الإجراء محجوب لسلامة العرض";

            return (
              <article key={record.id} className={panelClass}>
                {/* Entry Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--navy)]">
                        {auditActionLabel(record.action)}
                      </h3>
                      <span className="rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)]">
                        {auditResourceLabel(record.resourceType)}
                      </span>
                    </div>
                    <p
                      dir="ltr"
                      className="break-all font-mono text-[11px] text-[var(--muted)]"
                    >
                      {safeActionToken}
                    </p>
                  </div>

                  <time
                    dateTime={record.createdAt}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] tabular-nums"
                  >
                    <CalendarIcon className="size-3.5 shrink-0" />
                    <span>{utcDate(record.createdAt, true)} UTC</span>
                  </time>
                </div>

                {/* Actor & Resource Strip */}
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="min-w-0 space-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3">
                    <p className="flex items-center gap-1.5 font-semibold text-[var(--muted)]">
                      <UserIcon className="size-3.5 shrink-0" />
                      <span>المنفذ</span>
                    </p>
                    <p className="break-words text-sm font-semibold text-[var(--navy)]">
                      {record.actor.name}
                    </p>
                    <p
                      dir="ltr"
                      className="break-all font-mono text-[11px] text-[var(--muted)]"
                    >
                      {record.actorAdminId}
                    </p>
                  </div>

                  <div className="min-w-0 space-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3">
                    <p className="flex items-center gap-1.5 font-semibold text-[var(--muted)]">
                      <ShieldCheckIcon className="size-3.5 shrink-0" />
                      <span>المورد المتأثر</span>
                    </p>
                    <p className="break-words text-sm font-semibold text-[var(--navy)]">
                      {auditResourceLabel(record.resourceType)}
                    </p>
                    <p
                      dir="ltr"
                      className="break-all font-mono text-[11px] text-[var(--muted)]"
                    >
                      {record.resourceId}
                    </p>
                  </div>
                </div>

                {/* Allowlisted Safe Metadata */}
                <details className="rounded-xl border border-[var(--line)] bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                    البيانات الوصفية الآمنة
                    {metadata.rows.length ? ` (${metadata.rows.length})` : ""}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {metadata.rows.length ? (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {metadata.rows.map((row) => (
                          <div
                            key={row.label}
                            className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2"
                          >
                            <dt className="text-[11px] font-semibold text-[var(--muted)]">
                              {row.label}
                            </dt>
                            <dd className="mt-0.5 break-words font-mono text-xs font-semibold text-[var(--navy)]">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-xs text-[var(--muted)]">
                        لا توجد بيانات وصفية مسموح بعرضها لهذا الحدث.
                      </p>
                    )}

                    {metadata.hasHiddenFields ? (
                      <p className="text-[11px] text-[var(--muted)]">
                        حُجبت حقول إضافية غير مصرح بعرضها حمايةً للخصوصية. السجل الأصلي في الخادم لم يُعدّل.
                      </p>
                    ) : null}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}

      <PageControls
        data={query.data}
        change={(page) => setParams((old) => ({ ...old, page }))}
      />
    </section>
  );
}
