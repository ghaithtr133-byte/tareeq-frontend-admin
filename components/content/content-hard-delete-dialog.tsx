"use client";

import { useEffect, useRef, useState } from "react";

import {
  getContentHardDeleteConflict,
  type ContentHardDeleteConflict,
  type HardDeletableContentResource,
} from "@/lib/api-client/content";
import { normalizeApiError } from "@/lib/api-client/error";
import { StaleContentSessionError } from "@/lib/content-session";
import { useContentHardDeleteMutation } from "@/hook/mutations/use-content-hard-delete-mutation";
import { useAdminAccess } from "@/providers/admin-access-provider";

const labels: Record<HardDeletableContentResource, string> = {
  countries: "الدولة",
  universities: "الجامعة",
  scholarships: "المنحة الدراسية",
  articles: "المقال",
};

function isInternalRetention(item: ContentHardDeleteConflict["impact"]["items"][number]) {
  const value = `${item.resourceType} ${item.relationshipPath} ${item.code}`.toLowerCase();
  return value.includes("audit") || value.includes("history");
}

function isDemoFixtureProtected(conflict: ContentHardDeleteConflict) {
  return conflict.impact.items.some((item) => item.code === "DEMO_FIXTURE_PROTECTED");
}

function recordLabel(resourceType: string) {
  return {
    STUDENT_APPLICATION: "طلبات طلاب",
    GENERAL_INQUIRY: "استفسارات",
    ARTICLE: "مقالات مرتبطة",
    SCHOLARSHIP: "منح مرتبطة",
    UNIVERSITY: "جامعات مرتبطة",
    COUNTRY: "دول مرتبطة",
    SERVICE: "خدمات مرتبطة",
  }[resourceType] ?? "سجلات مستقلة مرتبطة";
}

function errorMessage(error: unknown, resource: HardDeletableContentResource, confirming: boolean) {
  const normalized = normalizeApiError(error);
  const label = labels[resource];
  if (normalized.kind === "network") return "تعذّر الاتصال بالخادم. لم يُحذف العنصر.";
  if (normalized.status === 401) return "انتهت الجلسة. سجّل الدخول مجددًا قبل إعادة المحاولة.";
  if (normalized.status === 403) return confirming ? "تأكيد الحذف النهائي محصور بمدير أعلى." : `لا تملك صلاحية حذف ${label}.`;
  if (normalized.status === 404) return `لم تعد ${label} موجودة. حدّث القائمة.`;
  if (normalized.status === 409) return "تعذّر إتمام الحذف بسبب تبعيات العنصر أو تغيّرها.";
  return `تعذّر حذف ${label}. لم تتغير القائمة.`;
}

function ImpactDetails({ conflict }: { conflict: ContentHardDeleteConflict }) {
  const blockedItems = conflict.impact.items.filter((item) => item.blocked && !isInternalRetention(item));
  const independentlyDeletedItems = conflict.impact.items.filter(
    (item) => !item.blocked && item.effect === "DELETE" && !isInternalRetention(item),
  );
  const visibleItems = conflict.code === "DELETE_BLOCKED" ? blockedItems : independentlyDeletedItems;
  if (!visibleItems.length && conflict.code !== "DELETE_BLOCKED") return null;

  const demoProtected = isDemoFixtureProtected(conflict);
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-right">
      <p className="text-sm font-bold text-amber-950">
        {demoProtected ? "لا يمكن حذف هذا العنصر لأنه جزء من البيانات التجريبية المحمية." : conflict.code === "DELETE_BLOCKED"
          ? "الحذف محجوب لحماية بيانات مرتبطة."
          : "سيؤدي الحذف النهائي إلى إزالة سجلات محتوى مرتبطة."}
      </p>
      {visibleItems.length && !demoProtected ? (
        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-900">
          {visibleItems.map((item) => <li key={`${item.resourceType}-${item.code}`}>{item.count} {recordLabel(item.resourceType)}{item.blocked ? " محمية" : ""}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export function ContentHardDeleteDialog({
  resource,
  record,
  onClose,
  onDeleted,
}: {
  resource: HardDeletableContentResource;
  record: { id: string; nameAr: string };
  onClose: () => void;
  onDeleted: () => void;
}) {
  const access = useAdminAccess();
  const deletion = useContentHardDeleteMutation();
  const [conflict, setConflict] = useState<ContentHardDeleteConflict>();
  const [message, setMessage] = useState("");
  const requestInFlight = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const canConfirm = access.user?.role === "SUPER_ADMIN" && Boolean(conflict?.confirmation);
  const label = labels[resource];

  useEffect(() => { window.requestAnimationFrame(() => cancelRef.current?.focus()); }, []);

  async function submit() {
    if (requestInFlight.current || deletion.isPending || access.mockEnabled) return;
    requestInFlight.current = true;
    setMessage("");
    try {
      if (conflict?.confirmation) {
        if (!canConfirm) return;
        await deletion.confirm(resource, record.id, conflict.confirmation.challengeId);
      } else {
        await deletion.request(resource, record.id);
      }
      onDeleted();
    } catch (error) {
      if (error instanceof StaleContentSessionError) return;
      const nextConflict = getContentHardDeleteConflict(error);
      if (nextConflict) {
        setConflict(nextConflict);
        setMessage(nextConflict.code === "DELETE_BLOCKED" && isDemoFixtureProtected(nextConflict)
          ? "لا يمكن حذف هذا العنصر لأنه جزء من البيانات التجريبية المحمية."
          : nextConflict.code === "DELETE_BLOCKED" ? "الحذف محجوب من الخادم. لم تُحذف أي بيانات." : "");
      } else {
        setMessage(errorMessage(error, resource, Boolean(conflict?.confirmation)));
      }
    } finally {
      requestInFlight.current = false;
    }
  }

  const pending = deletion.isPending;
  const blocked = conflict?.code === "DELETE_BLOCKED";
  const requiresConfirmation = Boolean(conflict?.confirmation);
  const showSubmit = !blocked && (!requiresConfirmation || canConfirm);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-5" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="content-hard-delete-title" aria-describedby="content-hard-delete-description" className="w-full max-w-md rounded-2xl bg-white p-5 text-right shadow-2xl">
        <h3 id="content-hard-delete-title" className="text-lg font-bold text-[var(--navy)]">حذف {label} نهائياً</h3>
        <p id="content-hard-delete-description" className="mt-2 text-sm leading-6 text-[var(--muted)]">سيُحذف {label} «{record.nameAr}» نهائياً. هذا الإجراء دائم ولا يمكن التراجع عنه.</p>
        {conflict ? <ImpactDetails conflict={conflict} /> : null}
        {message ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{message}</p> : null}
        {requiresConfirmation && !canConfirm && !blocked ? <p className="mt-3 text-sm font-medium text-red-700">يتطلب الحذف النهائي صلاحية المدير الأعلى (SUPER_ADMIN) وفق سياسة الخادم؛ لم يُحذف العنصر.</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {showSubmit ? <button type="button" disabled={pending} onClick={() => void submit()} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-wait disabled:opacity-45">{pending ? "جارٍ الحذف…" : requiresConfirmation ? "تأكيد الحذف النهائي" : "حذف نهائي"}</button> : null}
          <button ref={cancelRef} type="button" disabled={pending} onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-45">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
