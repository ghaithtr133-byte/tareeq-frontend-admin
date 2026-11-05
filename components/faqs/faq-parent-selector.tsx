"use client";
import { useState } from "react";
import { useFaqParents } from "@/hook/queries/use-faq-queries";
import { faqScopeLabels, type FaqScope } from "@/lib/faq-schemas";
import { buttonClass, inputClass, PageControls } from "@/components/universities/controls";
export function FaqParentSelector({ scope, value, onChange, disabled }: { scope: FaqScope; value: string; onChange: (id: string) => void; disabled: boolean }) {
  const [page, setPage] = useState(1); const [draft, setDraft] = useState(""); const [search, setSearch] = useState(""); const parents = useFaqParents(scope, page, search);
  if (scope === "GLOBAL") return <p className="text-sm">الأسئلة العامة بلا سجل مرتبط.</p>;
  return <div className="min-w-0 space-y-2"><label className="grid gap-1 text-sm font-semibold">السجل المرتبط ({faqScopeLabels[scope]})<select aria-label="السجل المرتبط" className={inputClass} disabled={disabled} value={value} onChange={event => onChange(event.target.value)}><option value="">اختر سجلًا</option>{value && !parents.data?.items.some(item => item.id === value) ? <option value={value}>{value} (مختار)</option> : null}{parents.data?.items.map(item => <option key={item.id} value={item.id}>{"nameAr" in item ? item.nameAr : item.titleAr}</option>)}</select></label>
    {scope !== "SERVICE" ? <div className="flex flex-wrap gap-2"><input aria-label="بحث السجلات المرتبطة" className={inputClass} maxLength={200} disabled={disabled} value={draft} onChange={event => setDraft(event.target.value)} /><button className={buttonClass} disabled={disabled} type="button" onClick={() => { setSearch(draft); setPage(1); }}>بحث السجلات</button></div> : <p className="text-xs">عقد قائمة الخدمات يدعم التصفح ولا يدعم البحث النصي.</p>}
    {parents.isFetching ? <p role="status">جارٍ تحميل الخيارات…</p> : null}{parents.isError ? <p role="alert" className="text-sm text-red-700">تعذّر تحميل السجلات المرتبطة. <button type="button" disabled={disabled} onClick={() => void parents.refetch()}>إعادة المحاولة</button></p> : null}{parents.data?.items.length === 0 ? <p className="text-sm">لا توجد سجلات مطابقة.</p> : null}<fieldset disabled={disabled}><PageControls data={parents.data} change={setPage} /></fieldset>
  </div>;
}
