"use client";

import { useState } from "react";
import type { ArticleRelatedScholarship } from "@/api/content";
import { useContentList } from "@/hook/queries/use-content-queries";
import { buttonClass, inputClass, PageControls } from "@/components/universities/controls";

/** The ordered selection is independent of the current lookup page or search. */
export function ArticleScholarships({ value, onChange, selected = [], disabled, error }: {
  value: string[]; onChange: (ids: string[]) => void; selected?: ArticleRelatedScholarship[]; disabled: boolean; error?: string;
}) {
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [candidate, setCandidate] = useState("");
  const list = useContentList("scholarships", { page, limit: 50, search: search.trim() || undefined, sort: "newest" }, true, false);
  const [chosenLabels, setChosenLabels] = useState<Record<string, string>>({});
  function move(index: number, delta: number) { const ids = [...value]; [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]; onChange(ids); }
  return <fieldset disabled={disabled} className="space-y-3 rounded-xl border border-[var(--line)] p-4">
    <legend className="px-1 font-bold">المنح المرتبطة بالترتيب ({value.length}/50)</legend>
    <label className="grid gap-1 text-sm">بحث المنح المرتبطة<input aria-label="بحث المنح المرتبطة" type="search" maxLength={200} className={inputClass} value={search} onChange={event => { setSearch(event.target.value); setPage(1); setCandidate(""); }} /></label>
    <label className="grid gap-1 text-sm">اختيار منحة للربط<select aria-label="اختيار منحة للربط" className={inputClass} value={candidate} onChange={event => setCandidate(event.target.value)}><option value="">اختر منحة</option>{list.data?.items.filter(item => !value.includes(item.id)).map(item => <option key={item.id} value={item.id}>{item.titleAr}</option>)}</select></label>
    <button type="button" className={buttonClass} disabled={!candidate || value.includes(candidate) || value.length >= 50 || list.isFetching || list.isError} onClick={() => {
      const item = list.data?.items.find(item => item.id === candidate); if (!item || value.includes(candidate) || value.length >= 50) return;
      setChosenLabels(old => ({ ...old, [item.id]: item.titleAr })); onChange([...value, candidate]); setCandidate("");
    }}>إضافة المنحة للارتباط</button>
    {list.isFetching ? <p role="status">جارٍ تحميل المنح…</p> : list.isError ? <p role="alert">تعذّر تحميل المنح. <button type="button" className="underline" onClick={() => void list.refetch()}>إعادة تحميل المنح</button></p> : list.data?.items.length === 0 ? <p>لا توجد نتائج مطابقة للبحث.</p> : null}
    <PageControls data={list.data} change={next => { setPage(next); setCandidate(""); }} />
    <ol className="space-y-2">{value.map((id, index) => <li key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] p-3">
      <span className="min-w-0 flex-1 break-words">{index + 1}. {list.data?.items.find(item => item.id === id)?.titleAr ?? chosenLabels[id] ?? selected.find(item => item.id === id)?.titleAr ?? `${id} (مختارة)`}</span>
      <button type="button" className={buttonClass} aria-label={`رفع المنحة ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>أعلى</button>
      <button type="button" className={buttonClass} aria-label={`خفض المنحة ${index + 1}`} disabled={index === value.length - 1} onClick={() => move(index, 1)}>أسفل</button>
      <button type="button" className={buttonClass} aria-label={`إزالة المنحة ${index + 1}`} onClick={() => onChange(value.filter(item => item !== id))}>إزالة الارتباط</button>
    </li>)}</ol>
    {value.length ? <button type="button" className={buttonClass} onClick={() => { if (window.confirm("مسح جميع ارتباطات المنح؟")) onChange([]); }}>مسح ارتباطات المنح</button> : <p>لا توجد منح مرتبطة.</p>}
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
  </fieldset>;
}
