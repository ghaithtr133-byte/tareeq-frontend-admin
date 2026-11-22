"use client";

import { useState } from "react";
import { normalizeApiError } from "@/lib/api-client/error";
import { useFaqMutation } from "@/hook/mutations/use-faq-mutation";
import { useFaqOrder } from "@/hook/queries/use-faq-queries";
import type { Faq, FaqGroup } from "@/lib/faq-schemas";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/admin-icons";
import { buttonClass, panelClass, primaryButtonClass } from "@/components/universities/controls";
import { LoadingState } from "@/components/dashboard/states";

function OrderForm({
  items,
  group,
  close,
}: {
  items: Faq[];
  group: FaqGroup;
  close: (saved?: boolean) => void;
}) {
  const [order, setOrder] = useState(items);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const mutation = useFaqMutation(group);

  const move = (index: number, delta: number) =>
    setOrder((old) => {
      const next = [...old];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });

  return (
    <section className={panelClass}>
      <div>
        <h3 className="text-base font-bold text-[var(--navy)]">
          ترتيب المجموعة كاملة ({order.length})
        </h3>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          يشمل جميع الأسئلة غير المؤرشفة لهذا النطاق والارتباط فقط، دون مرشح الحالة.
        </p>
      </div>

      {order.length ? (
        <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
          {order.map((faq, index) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
              key={faq.id}
            >
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--navy)]">
                <span className="ml-2 text-xs font-bold text-[var(--gold-dark)] tabular-nums">
                  {index + 1}.
                </span>
                {faq.questionAr}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={buttonClass}
                  aria-label={`رفع السؤال ${index + 1}`}
                  disabled={stale || mutation.isPending || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon className="size-3.5" />
                  <span>أعلى</span>
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  aria-label={`خفض السؤال ${index + 1}`}
                  disabled={stale || mutation.isPending || index === order.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownIcon className="size-3.5" />
                  <span>أسفل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">لا توجد أسئلة غير مؤرشفة لترتيبها.</p>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryButtonClass}
          disabled={stale || mutation.isPending || !order.length}
          onClick={async () => {
            setError("");
            try {
              await mutation.mutateAsync({ orderedIds: order.map((faq) => faq.id) });
              close(true);
            } catch (failure) {
              if (normalizeApiError(failure).status === 409) {
                setStale(true);
                setError(
                  "تغيرت مجموعة الأسئلة. لم يُعاد الطلب؛ أغلق الترتيب وأعد تحميله قبل الحفظ.",
                );
              } else setError("تعذّر حفظ الترتيب. احتُفظ بالترتيب المحلي.");
            }
          }}
        >
          حفظ الترتيب
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={mutation.isPending}
          onClick={() => close()}
        >
          إغلاق الترتيب
        </button>
      </div>
    </section>
  );
}

export function FaqOrder({
  group,
  close,
}: {
  group: FaqGroup;
  close: (saved?: boolean) => void;
}) {
  const query = useFaqOrder(group);
  if (query.isPending || query.isFetching) return <LoadingState />;
  if (query.isError)
    return (
      <section className={panelClass}>
        <p role="alert" className="text-xs font-medium text-red-700">
          تعذّر تحميل المجموعة كاملة. لن يُرسل ترتيب جزئي.
        </p>
        <div className="flex gap-2">
          <button className={primaryButtonClass} onClick={() => void query.refetch()}>
            إعادة تحميل المجموعة
          </button>
          <button className={buttonClass} onClick={() => close()}>
            إلغاء الترتيب
          </button>
        </div>
      </section>
    );
  return <OrderForm items={query.data} group={group} close={close} />;
}
