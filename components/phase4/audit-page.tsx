"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/dashboard/states";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon, UserIcon } from "@/components/ui/admin-icons";
import { buttonClass, inputClass, panelClass } from "@/components/universities/controls";
import { useAuditLogs } from "@/hook/queries/use-phase4-queries";
import { auditResourceLabel, auditResourceTypeLabels } from "@/lib/content-labels";
import { auditActionTitle, safeAuditActionCode, safeAuditMetadata, utcDate } from "@/lib/phase4-presentation";
import { auditParamsSchema, auditResourceTypes, type AuditParams, type AuditLog } from "@/lib/phase4-schemas";
import { isoFormDate, uuidSchema } from "@/lib/university-schemas";
import { Phase4Error } from "./query-state";

const initialDraft = { resourceType: "", knownAction: "", action: "", actorId: "", from: "", to: "" };
const knownActions = [
  { value: "content.country.created", resourceType: "COUNTRY" },
  { value: "content.country.updated", resourceType: "COUNTRY" },
  { value: "content.country.status_changed", resourceType: "COUNTRY" },
  { value: "admin.user.role_changed", resourceType: "ADMIN_USER" },
] as const;
type AuditDraft = typeof initialDraft;

function parseDraft(draft: AuditDraft): { params: AuditParams } | { error: string } {
  const from = isoFormDate(draft.from);
  const to = isoFormDate(draft.to);
  if ((draft.from && !from) || (draft.to && !to)) return { error: "أدخل تاريخًا ووقتًا صالحين." };
  if (Boolean(from) !== Boolean(to)) return { error: "أدخل وقت البداية والنهاية معًا قبل التصفية." };
  if (from && to && Date.parse(from) > Date.parse(to)) return { error: "وقت البداية يجب أن يسبق أو يساوي وقت النهاية." };
  const actorId = draft.actorId.trim() || undefined;
  if (actorId && !uuidSchema.safeParse(actorId).success) return { error: "معرّف المنفذ يجب أن يكون UUID صالحًا." };
  const parsed = auditParamsSchema.safeParse({ page: 1, limit: 20, resourceType: draft.resourceType || undefined, action: (draft.action || draft.knownAction).trim() || undefined, actorId, from: from ?? undefined, to: to ?? undefined });
  return parsed.success ? { params: parsed.data } : { error: "رمز العملية أو أحد المرشحات غير صالح." };
}

function AuditSkeleton() {
  return <div aria-busy="true" aria-label="جارٍ تحميل سجل التدقيق" className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className={`${panelClass} animate-pulse`}><div className="h-4 w-48 rounded bg-slate-200/80" /><div className="h-3 w-28 rounded bg-slate-100" /><div className="grid gap-3 sm:grid-cols-2"><div className="h-16 rounded-xl bg-slate-100" /><div className="h-16 rounded-xl bg-slate-100" /></div></div>)}</div>;
}

function CopyIdentifier({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); } catch { setCopied(false); } }
  return <div className="flex min-w-0 items-center gap-2"><code dir="ltr" className="min-w-0 break-all font-mono text-[11px] text-[var(--muted)]">{value}</code><button type="button" className="shrink-0 text-[11px] font-semibold text-[var(--navy)] underline" onClick={() => void copy()}>{copied ? "تم النسخ" : `نسخ ${label}`}</button></div>;
}

function AuditDetails({ record }: { record: AuditLog }) {
  const metadata = safeAuditMetadata(record.metadata);
  const actionCode = safeAuditActionCode(record.action);
  return <details className="rounded-xl border border-[var(--line)] bg-white p-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">عرض التفاصيل</summary><div className="mt-3 space-y-3"><dl className="grid gap-3 text-xs sm:grid-cols-2"><div><dt className="font-semibold text-[var(--muted)]">رمز العملية الأصلي</dt><dd className="mt-1"><CopyIdentifier label="الرمز" value={actionCode} /></dd></div><div><dt className="font-semibold text-[var(--muted)]">نوع المورد</dt><dd className="mt-1 font-medium text-[var(--navy)]">{auditResourceLabel(record.resourceType)}</dd></div><div><dt className="font-semibold text-[var(--muted)]">معرّف المورد</dt><dd className="mt-1"><CopyIdentifier label="المعرّف" value={record.resourceId} /></dd></div><div><dt className="font-semibold text-[var(--muted)]">معرّف المنفذ</dt><dd className="mt-1"><CopyIdentifier label="المعرّف" value={record.actorAdminId} /></dd></div><div><dt className="font-semibold text-[var(--muted)]">التوقيت الدقيق</dt><dd dir="ltr" className="mt-1 font-mono text-[11px] text-[var(--navy)]">{record.createdAt}</dd></div></dl>{metadata.transitions.map((transition) => <p key={transition.label} className="rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--navy)]"><span className="font-semibold">{transition.label}: </span>{transition.from} → {transition.to}</p>)}{metadata.rows.length ? <dl className="grid gap-3 sm:grid-cols-2">{metadata.rows.map((row) => <div key={row.label} className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2"><dt className="text-[11px] font-semibold text-[var(--muted)]">{row.label}</dt><dd className="mt-0.5 text-xs font-semibold text-[var(--navy)]">{row.value}</dd></div>)}</dl> : <p className="text-xs text-[var(--muted)]">لا توجد بيانات وصفية مسموح بعرضها لهذا الحدث.</p>}{metadata.hasHiddenFields ? <p className="text-[11px] text-[var(--muted)]">حُجبت حقول إضافية غير مصرح بعرضها حمايةً للخصوصية.</p> : null}</div></details>;
}

export function AuditPage() {
  const [draft, setDraft] = useState<AuditDraft>(initialDraft);
  const [params, setParams] = useState<AuditParams>({ page: 1, limit: 20 });
  const [error, setError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const query = useAuditLogs(params);
  const activeFilters = Boolean(params.resourceType || params.action || params.actorId || params.from || params.to);
  useEffect(() => { const typed = Boolean(draft.action.trim() || draft.actorId.trim()); const timeout = window.setTimeout(() => { const next = parseDraft(draft); if ("error" in next) { setError(next.error); return; } setError(""); setParams(next.params); }, typed ? 400 : 0); return () => window.clearTimeout(timeout); }, [draft]);
  const knownActionOptions = useMemo(() => knownActions.map((entry) => ({ ...entry, label: auditActionTitle(entry.value, entry.resourceType) })), []);
  function updateDraft(patch: Partial<AuditDraft>) { setDraft((current) => ({ ...current, ...patch })); }
  function reset() { setDraft(initialDraft); setParams({ page: 1, limit: 20 }); setError(""); setAdvancedOpen(false); }

  return <section className="min-w-0 space-y-5">
    <header><p className="text-xs font-semibold text-[var(--gold-dark)]">الأمان والرقابة · SUPER_ADMIN</p><h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">سجل التدقيق</h2><p className="mt-1 text-xs text-[var(--muted)]">سجل قراءة فقط، مرتب بالأحدث أولًا، مع إخفاء الحقول الحساسة.</p></header>
    <section className={`${panelClass} space-y-4`} aria-label="تصفية سجل التدقيق">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3"><h3 className="text-sm font-bold text-[var(--navy)]">تصفية السجل</h3>{activeFilters ? <button type="button" className={buttonClass} onClick={reset}><RotateCcwIcon className="size-3.5" /><span>مسح الفلاتر</span></button> : null}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>القسم المتأثر</span><div className="relative"><select value={draft.resourceType} onChange={(event) => updateDraft({ resourceType: event.target.value })} className={`${inputClass} appearance-none pl-9`}><option value="">كل الموارد</option>{auditResourceTypes.map((value) => <option key={value} value={value}>{auditResourceTypeLabels[value]}</option>)}</select><ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /></div></label>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>نوع العملية</span><div className="relative"><select value={draft.knownAction} onChange={(event) => updateDraft({ knownAction: event.target.value, action: "" })} className={`${inputClass} appearance-none pl-9`}><option value="">كل العمليات</option>{knownActionOptions.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select><ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /></div></label>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>من (وقت محلي)</span><input value={draft.from} onChange={(event) => updateDraft({ from: event.target.value })} type="datetime-local" step={1} className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>إلى (وقت محلي)</span><input value={draft.to} onChange={(event) => updateDraft({ to: event.target.value })} type="datetime-local" step={1} className={inputClass} /></label>
      </div>
      <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">مرشحات متقدمة</summary><div className="mt-3 grid gap-4 md:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>رمز العملية الدقيق</span><input value={draft.action} onChange={(event) => updateDraft({ action: event.target.value, knownAction: "" })} dir="ltr" maxLength={100} placeholder="content.country.status_changed" className={`${inputClass} font-mono text-xs`} /></label><label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]"><span>معرّف المنفذ (UUID)</span><input value={draft.actorId} onChange={(event) => updateDraft({ actorId: event.target.value })} dir="ltr" maxLength={36} placeholder="00000000-0000-0000-0000-000000000000" className={`${inputClass} font-mono text-xs`} /></label></div><p className="mt-3 text-[11px] text-[var(--muted)]">العقد الحالي لا يدعم التصفية بمعرّف المورد المتأثر؛ لا يُرسل هذا المرشح إلى الخادم.</p></details>
    </section>
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">{error}</p> : null}
    {query.isPending ? <AuditSkeleton /> : query.isError ? <Phase4Error error={query.error} retry={query.refetch} /> : !query.data || !query.data.items.length ? (activeFilters ? <div className={`${panelClass} text-center text-sm text-[var(--muted)]`}>لا توجد سجلات مطابقة للمرشحات الحالية.</div> : <EmptyState />) : <div className="space-y-3">{query.data.items.map((record) => <article key={record.id} className={panelClass}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-[var(--navy)]">{auditActionTitle(record.action, record.resourceType)}</h3><span className="rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)]">{auditResourceLabel(record.resourceType)}</span></div><p className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><UserIcon className="size-3.5" /><span>{record.actor.name}</span></p></div><time dateTime={record.createdAt} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] tabular-nums"><CalendarIcon className="size-3.5 shrink-0" /><span>{utcDate(record.createdAt, true)} UTC</span></time></div><AuditDetails record={record} /></article>)}</div>}
    {query.data ? <nav aria-label="صفحات السجلات" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"><span className="text-xs font-medium text-[var(--muted)] tabular-nums">صفحة <strong className="text-[var(--navy)]">{query.data.pagination.page}</strong> من <strong className="text-[var(--navy)]">{Math.max(1, query.data.pagination.totalPages)}</strong> · <strong className="text-[var(--navy)]">{query.data.pagination.total}</strong> سجل</span><div className="flex items-center gap-2"><button type="button" className={buttonClass} disabled={query.data.pagination.page <= 1 || query.isFetching} onClick={() => setParams((current) => ({ ...current, page: current.page! - 1 }))}><ChevronRightIcon className="size-4" /><span>السابق</span></button><button type="button" className={buttonClass} disabled={query.data.pagination.page >= query.data.pagination.totalPages || query.isFetching} onClick={() => setParams((current) => ({ ...current, page: current.page! + 1 }))}><span>التالي</span><ChevronLeftIcon className="size-4" /></button></div></nav> : null}
  </section>;
}
