"use client";
import { useState } from "react";
import { normalizeApiError } from "@/api/error";
import { useFaqList } from "@/hook/queries/use-faq-queries";
import { faqGroupSchema, faqScopeLabels, faqScopes, type Faq, type FaqGroup } from "@/lib/faq-schemas";
import { publicationStatusOptions } from "@/lib/content-config";
import type { PublicationStatus } from "@/api/content";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import { buttonClass, inputClass, PageControls, panelClass } from "@/components/universities/controls";
import { FaqParentSelector } from "./faq-parent-selector";
import { FaqEditor } from "./faq-editor";
import { FaqOrder } from "./faq-order";
export function FaqPage() {
  const access = useAdminAccess(); const [group, setGroup] = useState<FaqGroup>({ scope: "GLOBAL" }); const [page, setPage] = useState(1); const [limit, setLimit] = useState(50); const [status, setStatus] = useState<PublicationStatus | undefined>(); const [editor, setEditor] = useState<Faq | "new">(); const [ordering, setOrdering] = useState(false); const [message, setMessage] = useState("");
  const valid = faqGroupSchema.safeParse(group).success; const list = useFaqList({ ...group, page, limit, status }); const locked = Boolean(editor) || ordering;
  if (access.mockEnabled) return <p>إدارة الأسئلة الشائعة تتطلب جلسة Backend. لا تُرسل بيانات معاينة إلى الخادم.</p>;
  return <section className="space-y-5"><div className="flex flex-wrap items-center gap-3"><h2 className="flex-1 text-2xl font-bold">الأسئلة الشائعة</h2><button className={buttonClass} disabled={!valid || locked} onClick={() => { setMessage(""); setEditor("new"); }}>إضافة سؤال</button><button className={buttonClass} disabled={!valid || locked} onClick={() => { setMessage(""); setOrdering(true); }}>ترتيب الأسئلة</button></div>
    <fieldset disabled={locked} className={`${panelClass} grid min-w-0 gap-4 md:grid-cols-2`}>
      <label className="grid gap-1 text-sm font-semibold">نطاق الأسئلة<select aria-label="نطاق الأسئلة" className={inputClass} value={group.scope} onChange={event => { setGroup({ scope: event.target.value as FaqGroup["scope"] }); setPage(1); setMessage(""); }}>{faqScopes.map(scope => <option key={scope} value={scope}>{faqScopeLabels[scope]}</option>)}</select></label>
      <FaqParentSelector key={group.scope} scope={group.scope} value={group.parentId ?? ""} disabled={locked} onChange={parentId => { setGroup(old => ({ ...old, parentId: parentId || undefined })); setPage(1); setMessage(""); }} />
      <label className="grid gap-1 text-sm font-semibold">تصفية الحالة<select aria-label="تصفية الحالة" className={inputClass} value={status ?? ""} onChange={event => { setStatus(event.target.value ? event.target.value as PublicationStatus : undefined); setPage(1); }}><option value="">كل الحالات</option>{publicationStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold">عدد السجلات<select aria-label="عدد السجلات" className={inputClass} value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1); }}>{[12, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
    </fieldset>
    {message ? <p role="status">{message}</p> : null}{editor ? <FaqEditor group={group} record={editor === "new" ? undefined : editor} close={saved => { setEditor(undefined); setMessage(saved ? "تم حفظ السؤال بنجاح." : ""); }} /> : null}{ordering ? <FaqOrder group={group} close={saved => { setOrdering(false); setMessage(saved ? "تم حفظ ترتيب المجموعة." : ""); }} /> : null}
    {!valid ? <p className="text-sm">اختر السجل المرتبط لعرض هذه المجموعة.</p> : list.isPending ? <LoadingState /> : list.isError ? normalizeApiError(list.error).status === 403 ? <UnauthorizedState /> : <ErrorState action={<button className={buttonClass} onClick={() => void list.refetch()}>إعادة المحاولة</button>} /> : list.data.items.length === 0 ? <EmptyState /> : <div className="grid gap-3">{list.data.items.map(faq => <article key={faq.id} className={panelClass}><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-bold">{faq.questionAr}</h3><StatusBadge status={faq.status} /></div><p className="whitespace-pre-wrap break-words text-sm">{faq.answerAr}</p>{faq.questionEn !== null ? <p dir="ltr" className="break-words text-sm">{faq.questionEn}</p> : null}{faq.answerEn !== null ? <p dir="ltr" className="whitespace-pre-wrap break-words text-sm">{faq.answerEn}</p> : null}<p className="text-xs">ترتيب العرض: {faq.displayOrder}</p><button className={buttonClass} disabled={locked} onClick={() => { setMessage(""); setEditor(faq); }}>تعديل السؤال</button></article>)}</div>}{valid ? <PageControls data={list.data} change={next => { if (!locked) setPage(next); }} /> : null}
  </section>;
}
