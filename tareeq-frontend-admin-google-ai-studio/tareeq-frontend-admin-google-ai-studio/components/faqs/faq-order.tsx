"use client";
import { useState } from "react";
import { normalizeApiError } from "@/lib/api-client/error";
import { useFaqMutation } from "@/hook/mutations/use-faq-mutation";
import { useFaqOrder } from "@/hook/queries/use-faq-queries";
import type { Faq, FaqGroup } from "@/lib/faq-schemas";
import { buttonClass, panelClass } from "@/components/universities/controls";
import { LoadingState } from "@/components/dashboard/states";
function OrderForm({ items, group, close }: { items: Faq[]; group: FaqGroup; close: (saved?: boolean) => void }) {
  const [order, setOrder] = useState(items); const [error, setError] = useState(""); const [stale, setStale] = useState(false); const mutation = useFaqMutation(group);
  const move = (index: number, delta: number) => setOrder(old => { const next = [...old]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  return <section className={panelClass}><h3 className="font-bold">ترتيب المجموعة كاملة ({order.length})</h3><p className="text-sm">يشمل جميع الأسئلة غير المؤرشفة لهذا النطاق والارتباط فقط، دون مرشح الحالة.</p>{order.map((faq, index) => <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] py-2" key={faq.id}><span className="min-w-0 flex-1 break-words">{index + 1}. {faq.questionAr}</span><button className={buttonClass} aria-label={`رفع السؤال ${index + 1}`} disabled={stale || mutation.isPending || index === 0} onClick={() => move(index, -1)}>أعلى</button><button className={buttonClass} aria-label={`خفض السؤال ${index + 1}`} disabled={stale || mutation.isPending || index === order.length - 1} onClick={() => move(index, 1)}>أسفل</button></div>)}{!order.length ? <p>لا توجد أسئلة غير مؤرشفة لترتيبها.</p> : null}{error ? <p role="alert" className="text-red-700">{error}</p> : null}<div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={stale || mutation.isPending || !order.length} onClick={async () => { setError(""); try { await mutation.mutateAsync({ orderedIds: order.map(faq => faq.id) }); close(true); } catch (failure) { if (normalizeApiError(failure).status === 409) { setStale(true); setError("تغيرت مجموعة الأسئلة. لم يُعاد الطلب؛ أغلق الترتيب وأعد تحميله قبل الحفظ."); } else setError("تعذّر حفظ الترتيب. احتُفظ بالترتيب المحلي."); } }}>حفظ الترتيب</button><button className={buttonClass} disabled={mutation.isPending} onClick={() => close()}>إغلاق الترتيب</button></div></section>;
}
export function FaqOrder({ group, close }: { group: FaqGroup; close: (saved?: boolean) => void }) {
  const query = useFaqOrder(group);
  if (query.isPending || query.isFetching) return <LoadingState />;
  if (query.isError) return <section className={panelClass}><p role="alert">تعذّر تحميل المجموعة كاملة. لن يُرسل ترتيب جزئي.</p><button className={buttonClass} onClick={() => void query.refetch()}>إعادة تحميل المجموعة</button><button className={buttonClass} onClick={() => close()}>إلغاء الترتيب</button></section>;
  return <OrderForm items={query.data} group={group} close={close} />;
}
