"use client";
import { useState } from "react";
import type { ManagementPage, DirectoryKind } from "@/api/university-management";
import { useDirectoryList } from "@/hook/queries/use-university-management";
import { uuidSchema } from "@/lib/university-schemas";
export const inputClass = "min-h-11 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900";
export const buttonClass = "min-h-11 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--navy)] disabled:opacity-40";
export const panelClass = "space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-6";
export function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <div className="min-w-0 space-y-1"><p className="text-sm font-semibold text-[var(--navy)]">{label}</p>{children}</div>; }
export function PageControls({ data, change }: { data?: ManagementPage<unknown>; change: (page: number) => void }) {
  if (!data) return null;
  const { page, totalPages, total } = data.pagination;
  return <nav aria-label="صفحات السجلات" className="flex flex-wrap items-center gap-3 text-sm"><span>صفحة {page} من {Math.max(1, totalPages)} · {total} سجل</span><button className={buttonClass} type="button" disabled={page <= 1} onClick={() => change(page - 1)}>السابق</button><button className={buttonClass} type="button" disabled={page >= totalPages} onClick={() => change(page + 1)}>التالي</button></nav>;
}
/** Retain the selected UUID even outside the current server-side search page. */
export function DirectorySelector({ kind, value, onChange, countryId, label, selectedLabel, disabled }: { kind: DirectoryKind; value: string; onChange: (value: string) => void; countryId?: string; label: string; selectedLabel?: string; disabled?: boolean }) {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const validCountryId = uuidSchema.safeParse(countryId).success ? countryId : undefined;
  const list = useDirectoryList(kind, { page, limit: 50, search: search.trim() || undefined, ...(kind === "cities" ? { countryId: validCountryId } : {}) }, !disabled && (kind !== "cities" || Boolean(validCountryId)));
  return <div className="space-y-2"><input aria-label={`بحث ${label}`} type="search" maxLength={200} value={search} disabled={disabled} onChange={event => { setSearch(event.target.value); setPage(1); }} className={inputClass} />
    <select aria-label={label} className={inputClass} value={value} disabled={disabled || (kind === "cities" && !countryId)} onChange={event => onChange(event.target.value)}><option value="">بلا اختيار</option>{value && !list.data?.items.some(item => item.id === value) ? <option value={value}>{selectedLabel ?? value} (مختار)</option> : null}{list.data?.items.map(item => <option key={item.id} value={item.id}>{item.nameAr}</option>)}</select>
    {list.isFetching ? <p role="status" className="text-sm">جارٍ تحميل الخيارات…</p> : null}{list.isError ? <p role="alert" className="text-sm text-red-700">تعذّر تحميل الخيارات. <button type="button" onClick={() => void list.refetch()} className="underline">إعادة المحاولة</button></p> : null}{list.data?.items.length === 0 ? <p className="text-sm">لا توجد نتائج.</p> : null}<PageControls data={list.data} change={setPage} />
  </div>;
}
