"use client";

import { useState } from "react";
import { normalizeApiError } from "@/lib/api-client/error";
import { useFaqList } from "@/hook/queries/use-faq-queries";
import { useFaqDelete, useFaqMutation } from "@/hook/mutations/use-faq-mutation";
import {
  faqGroupSchema,
  faqScopeLabels,
  faqScopes,
  selectableFaqScopes,
  type Faq,
  type FaqGroup,
} from "@/lib/faq-schemas";
import { publicationStatusOptions } from "@/lib/content-config";
import type { PublicationStatus } from "@/lib/api-client/content";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  UnauthorizedState,
} from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  PageControls,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";
import { useContentDetail } from "@/hook/queries/use-content-queries";
import { FaqParentSelector } from "./faq-parent-selector";
import { FaqEditor } from "./faq-editor";
import { FaqOrder } from "./faq-order";

export function FaqPage({ initialGroup }: { initialGroup?: FaqGroup } = {}) {
  const access = useAdminAccess();
  const [group, setGroup] = useState<FaqGroup>(() => initialGroup ?? { scope: "GLOBAL" });
  const [parentLabel, setParentLabel] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [status, setStatus] = useState<PublicationStatus | undefined>();
  const [editor, setEditor] = useState<Faq | "new">();
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState("");
  const actions = useFaqMutation(group);
  const remove = useFaqDelete();
  const createGroup: FaqGroup = initialGroup && initialGroup.scope !== "SERVICE" ? initialGroup : { scope: "GLOBAL" };

  const deepLinkedScholarship = useContentDetail(
    "scholarships",
    group.scope === "SCHOLARSHIP" && group.parentId && !parentLabel && !access.mockEnabled
      ? group.parentId
      : undefined,
  );
  const resolvedParentLabel = parentLabel ?? deepLinkedScholarship.data?.titleAr;

  const valid = faqGroupSchema.safeParse(group).success;
  const list = useFaqList({ ...group, page, limit, status });
  const locked = Boolean(editor) || ordering;
  const hasActiveFilters = Boolean(status) || limit !== 50 || group.scope !== "GLOBAL";

  if (access.mockEnabled) {
    return (
      <section className="space-y-4">
        <header>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">المحتوى المساند</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">الأسئلة الشائعة</h2>
        </header>
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          إدارة الأسئلة الشائعة تتطلب جلسة خادم متصلة. لا تُرسل بيانات معاينة إلى الخادم.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">المحتوى المساند</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">الأسئلة الشائعة</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">إدارة الأسئلة وإجاباتها والصفحات المرتبطة بها</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={!valid || locked}
            onClick={() => {
              setMessage("");
              setOrdering(true);
            }}
          >
            <ArrowUpIcon className="size-3.5" />
            <span>ترتيب المجموعة</span>
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={locked}
            onClick={() => {
              setMessage("");
              setEditor("new");
            }}
          >
            <PlusIcon className="size-4" />
            <span>إضافة سؤال</span>
          </button>
        </div>
      </header>

      {/* Group Browser & List Filters (strictly isolated from Create/Edit form state) */}
      <fieldset disabled={ordering} className={`${panelClass} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4 text-[var(--gold-dark)]" />
            <h3 className="text-sm font-bold text-[var(--navy)]">سياق العرض وتصفية القائمة</h3>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setGroup({ scope: "GLOBAL" });
                setParentLabel(undefined);
                setStatus(undefined);
                setLimit(50);
                setPage(1);
                setMessage("");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--navy)] hover:text-[var(--gold-dark)]"
            >
              <RotateCcwIcon className="size-3.5" />
              <span>إعادة الضبط للعرض العام</span>
            </button>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>السياق (النطاق)</span>
            <div className="relative">
              <select
                aria-label="نطاق الأسئلة"
                className={`${inputClass} appearance-none pl-9`}
                value={group.scope}
                onChange={(event) => {
                  setGroup({ scope: event.target.value as FaqGroup["scope"] });
                  setParentLabel(undefined);
                  setPage(1);
                  setMessage("");
                }}
              >
                {(group.scope === "SERVICE" ? faqScopes : selectableFaqScopes).map((scope) => (
                  <option key={scope} value={scope}>
                    {faqScopeLabels[scope]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <FaqParentSelector
            key={group.scope}
            scope={group.scope}
            value={group.parentId ?? ""}
            selectedLabel={resolvedParentLabel}
            disabled={locked}
            onChange={(parentId, resolvedLabel) => {
              setGroup((old) => ({ ...old, parentId: parentId || undefined }));
              setParentLabel(resolvedLabel);
              setPage(1);
              setMessage("");
            }}
          />

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>حالة النشر</span>
            <div className="relative">
              <select
                aria-label="تصفية الحالة"
                className={`${inputClass} appearance-none pl-9`}
                value={status ?? ""}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                      ? (event.target.value as PublicationStatus)
                      : undefined,
                  );
                  setPage(1);
                }}
              >
                <option value="">كل الحالات</option>
                {publicationStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>عدد النتائج</span>
            <div className="relative">
              <select
                aria-label="عدد السجلات"
                className={`${inputClass} appearance-none pl-9`}
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[12, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value} سجل
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-2 text-xs">
          <span className="text-[var(--muted)]">
            المجموعة المعروضة:{" "}
            <strong className="text-[var(--navy)]">
              {faqScopeLabels[group.scope]}
              {group.scope !== "GLOBAL"
                ? ` · ${resolvedParentLabel ?? (group.parentId ? "سجل محدد" : "بانتظار تحديد السجل")}`
                : ""}
            </strong>
          </span>
          {list.data ? (
            <span className="text-[var(--muted)] tabular-nums">
              الإجمالي: <strong className="text-[var(--navy)]">{list.data.pagination.total}</strong> سؤال
            </span>
          ) : null}
        </div>
      </fieldset>

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900"
        >
          {message}
        </p>
      ) : null}

      {editor ? (
        <FaqEditor
          key={editor === "new" ? `new-${createGroup.scope}-${createGroup.parentId ?? "global"}` : editor.id}
          group={editor === "new" ? createGroup : { scope: editor.scope, parentId: editor.parentId ?? undefined }}
          parentLabel={editor === "new" ? undefined : resolvedParentLabel}
          record={editor === "new" ? undefined : editor}
          close={(savedGroup, savedLabel) => {
            setEditor(undefined);
            if (savedGroup) {
              setGroup(savedGroup);
              if (savedLabel !== undefined) setParentLabel(savedLabel);
              setPage(1);
              setMessage("تم حفظ السؤال بنجاح.");
            } else {
              setMessage("");
            }
          }}
        />
      ) : null}

      {ordering ? (
        <FaqOrder
          group={group}
          close={(saved) => {
            setOrdering(false);
            setMessage(saved ? "تم حفظ ترتيب المجموعة." : "");
          }}
        />
      ) : null}

      {!valid ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--muted)]">
          اختر الجهة المرتبطة في شريط السياق أعلاه لاستعراض الأسئلة الشائعة وترتيبها، أو اضغط «إضافة سؤال» لاختيار السياق المستهدف مباشرة.
        </div>
      ) : list.isPending ? (
        <LoadingState />
      ) : list.isError ? (
        normalizeApiError(list.error).status === 403 ? (
          <UnauthorizedState />
        ) : (
          <ErrorState
            action={
              <button className={primaryButtonClass} onClick={() => void list.refetch()}>
                إعادة المحاولة
              </button>
            }
          />
        )
      ) : list.data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {list.data.items.map((faq) => (
            <article key={faq.id} className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="break-words text-base font-bold leading-snug text-[var(--navy)]">
                    <span className="ml-2 text-xs font-bold text-[var(--gold-dark)] tabular-nums">
                      #{faq.displayOrder}
                    </span>
                    {faq.questionAr}
                  </h3>
                </div>
                <StatusBadge status={faq.status} />
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--muted)]">
                {faq.answerAr}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                <span className="text-[11px] text-[var(--muted)] tabular-nums">
                  {faqScopeLabels[faq.scope]}
                  {faq.scope !== "GLOBAL" ? ` · ${resolvedParentLabel ?? "ارتباط محفوظ"}` : ""}
                  {faq.publishedAt ? ` · نُشر في ${faq.publishedAt.slice(0, 10)}` : ""}
                </span>
                <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={locked}
                  onClick={() => {
                    setMessage("");
                    setEditor(faq);
                  }}
                >
                  <PencilIcon className="size-3.5" />
                  <span>تعديل</span>
                </button>
                {faq.status === "DRAFT" ? <button type="button" className={buttonClass} disabled={locked || actions.isPending} onClick={() => void actions.mutateAsync({ id: faq.id, update: { status: "PUBLISHED" } }).then(() => setMessage("تم نشر السؤال."), () => setMessage("تعذّر تغيير حالة السؤال."))}>نشر</button> : null}
                {faq.status === "PUBLISHED" ? <><button type="button" className={buttonClass} disabled={locked || actions.isPending} onClick={() => void actions.mutateAsync({ id: faq.id, update: { status: "DRAFT" } }).then(() => setMessage("تمت إعادة السؤال إلى المسودة."), () => setMessage("تعذّر تغيير حالة السؤال."))}>إرجاع لمسودة</button><button type="button" className={buttonClass} disabled={locked || actions.isPending} onClick={() => void actions.mutateAsync({ id: faq.id, update: { status: "ARCHIVED" } }).then(() => setMessage("تمت أرشفة السؤال."), () => setMessage("تعذّر أرشفة السؤال."))}>أرشفة</button></> : null}
                <button type="button" title={faq.status === "PUBLISHED" ? "أرشف السؤال قبل حذفه." : undefined} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-45" disabled={locked || remove.isPending || faq.status === "PUBLISHED"} onClick={() => { if (window.confirm(`سيُحذف السؤال «${faq.questionAr}» نهائياً. هل تريد المتابعة؟`)) void remove.mutateAsync(faq.id).then(() => setMessage("تم حذف السؤال."), () => setMessage("تعذّر حذف السؤال. لا يمكن حذف السؤال المنشور قبل أرشفته.")); }}><TrashIcon className="size-3.5" />حذف</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {valid ? (
        <PageControls
          data={list.data}
          change={(next) => {
            if (!locked) setPage(next);
          }}
        />
      ) : null}
    </section>
  );
}
