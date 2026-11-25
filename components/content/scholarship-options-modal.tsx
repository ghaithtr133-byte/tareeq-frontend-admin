"use client";

import { useEffect, useId } from "react";
import {
  CheckIcon,
  CloseIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  Settings2Icon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import {
  defaultScholarshipFundingTypes,
  defaultScholarshipStudyLevels,
} from "@/lib/content-labels";
import { scholarshipOptionDisplayLabel } from "@/lib/scholarship-form-helpers";

export type ScholarshipOptionKind = "studyLevel" | "fundingType";

const DEFAULTS: Record<ScholarshipOptionKind, readonly string[]> = {
  studyLevel: defaultScholarshipStudyLevels,
  fundingType: defaultScholarshipFundingTypes,
};

const TITLES: Record<ScholarshipOptionKind, string> = {
  studyLevel: "إدارة خيارات المستوى الدراسي",
  fundingType: "إدارة خيارات نوع التمويل",
};

const TA79_ENDPOINT_HINT: Record<ScholarshipOptionKind, string> = {
  studyLevel: "GET /api/v1/admin/scholarship-options?type=STUDY_LEVEL",
  fundingType: "GET /api/v1/admin/scholarship-options?type=FUNDING_TYPE",
};

/**
 * Provides static built-in baseline options until TA-79 backend catalog integration is wired.
 * Browser localStorage is intentionally NOT used as an administrative source of truth.
 */
export function useScholarshipOptionCatalog(kind: ScholarshipOptionKind) {
  return {
    options: DEFAULTS[kind],
    isDesignOnlyCatalog: true as const,
    updateOptions: () => undefined,
    resetDefaults: () => undefined,
  };
}

interface ScholarshipOptionsModalProps {
  kind: ScholarshipOptionKind;
  open: boolean;
  onClose: () => void;
  options: readonly string[];
  onUpdateOptions?: (updater: (prev: string[]) => string[]) => void;
  onResetDefaults?: () => void;
  currentValue?: string;
  onSelectValue?: (value: string) => void;
}

export function ScholarshipOptionsModal({
  kind,
  open,
  onClose,
  options,
  currentValue,
  onSelectValue,
}: ScholarshipOptionsModalProps) {
  const titleId = useId();
  const addInputId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmedCurrent = currentValue?.trim() ?? "";
  const normalizedCurrentLabel = trimmedCurrent
    ? scholarshipOptionDisplayLabel(kind, trimmedCurrent)
    : "";
  const hasCustomExistingValue = Boolean(
    trimmedCurrent && !options.includes(trimmedCurrent) && !options.includes(normalizedCurrentLabel),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-dropdown)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-dark)]">
              <Settings2Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className="text-[18px] font-bold leading-snug text-[var(--navy)]">
                {TITLES[kind]}
              </h3>
              <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                إدارة الكتالوج المركزي للخيارات (بانتظار ربط واجهة الخادم TA-79)
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-transparent text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:bg-slate-50 hover:text-[var(--navy)]"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/75 p-3.5 text-[13px] leading-6 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <LockIcon className="size-4 shrink-0 text-[var(--gold-dark)]" />
              <span>الحفظ المركزي غير متاح حاليًا — بانتظار ربط الخادم (TA-79)</span>
            </div>
            <p>
              تعرض هذه القائمة الخيارات المعتمدة افتراضيًا في الواجهة وتُحفظ أي قيمة مخزّنة مسبقًا
              بأمان. التعديلات المركزية (إضافة أو إعادة تسمية أو تعطيل خيار) تتطلب ربط واجهة
              الخادم:
            </p>
            <code
              dir="ltr"
              className="block overflow-x-auto whitespace-nowrap rounded-lg border border-amber-200/80 bg-white/80 px-2.5 py-1.5 text-left font-mono text-[12px] font-semibold text-amber-950"
            >
              {TA79_ENDPOINT_HINT[kind]}
            </code>
          </div>

          {/* Disabled central creation bar */}
          <div className="space-y-1.5" aria-disabled="true">
            <label
              htmlFor={addInputId}
              className="block text-[14px] font-semibold text-[var(--navy)]"
            >
              إضافة خيار مركزي جديد
            </label>
            <div className="flex items-center gap-2">
              <input
                id={addInputId}
                type="text"
                disabled
                value=""
                readOnly
                placeholder={
                  kind === "studyLevel"
                    ? "اسم المستوى الدراسي الجديد (يتطلب ربط الخادم)..."
                    : "اسم نوع التمويل الجديد (يتطلب ربط الخادم)..."
                }
                className="h-11 min-w-0 flex-1 cursor-not-allowed rounded-xl border border-[var(--line)] bg-slate-50 px-3.5 text-[15px] text-[var(--muted)]"
              />
              <button
                type="button"
                disabled
                title="الإضافة المركزية بانتظار ربط واجهة TA-79 في الخادم"
                className="inline-flex h-11 shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl bg-[var(--navy)]/45 px-4 text-[14px] font-bold text-white"
              >
                <PlusIcon className="size-4" />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-[var(--navy)]">
                الخيارات المتاحة ({options.length})
              </span>
              <span className="text-[13px] text-[var(--muted)]">
                يمكنك اختيار قيمة مباشرة لتعبئة الحقل
              </span>
            </div>

            <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
              {hasCustomExistingValue && trimmedCurrent ? (
                <div className="flex items-center justify-between gap-2 bg-[var(--gold-soft)]/35 px-3.5 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-[var(--navy)]">
                      {normalizedCurrentLabel}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--gold-dark)]">
                      قيمة محفوظة حاليًا في سجل المنحة
                    </span>
                  </div>
                  {onSelectValue ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectValue(trimmedCurrent);
                        onClose();
                      }}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[var(--gold)]/60 bg-white px-3 text-[13px] font-bold text-[var(--navy)] hover:bg-[var(--gold-soft)]"
                    >
                      <CheckIcon className="size-3.5 text-[var(--gold-dark)]" />
                      <span>إبقاء التحديد</span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              {options.map((option) => {
                const selected =
                  trimmedCurrent === option || normalizedCurrentLabel === option;
                return (
                  <div
                    key={option}
                    className={`flex items-center justify-between gap-2 px-3.5 py-3 ${
                      selected ? "bg-[var(--surface-subtle)]" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[var(--navy)]">
                        {option}
                      </span>
                      {selected ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--gold-dark)]">
                          <CheckIcon className="size-3.5" />
                          <span>محدد حاليًا في النموذج</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {onSelectValue ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectValue(option);
                            onClose();
                          }}
                          className={`inline-flex h-9 items-center rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
                            selected
                              ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                              : "border-[var(--line)] bg-white text-[var(--navy)] hover:border-[var(--navy)] hover:bg-slate-50"
                          }`}
                        >
                          {selected ? "مختار" : "اختيار"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled
                        aria-label={`تعديل ${option} (بانتظار ربط الخادم)`}
                        title="التعديل المركزي بانتظار ربط واجهة TA-79"
                        className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-lg text-[var(--muted)]/45"
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled
                        aria-label={`تعطيل ${option} (بانتظار ربط الخادم)`}
                        title="التعطيل المركزي بانتظار ربط واجهة TA-79"
                        className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-lg text-[var(--muted)]/45"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-2.5 border-t border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-center text-[13px] text-[var(--muted)] sm:text-right">
            التعديل والحفظ المركزي متوقف لحين ربط TA-79
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--navy)] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--navy-light)] sm:h-10 sm:w-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

