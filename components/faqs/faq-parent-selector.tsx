"use client";

import { useState } from "react";
import { useFaqParents } from "@/hook/queries/use-faq-queries";
import { faqScopeLabels, type FaqScope } from "@/lib/faq-schemas";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

export function FaqParentSelector({
  scope,
  value,
  selectedLabel,
  onChange,
  disabled,
  label,
}: {
  scope: FaqScope;
  value: string;
  selectedLabel?: string;
  onChange: (id: string, resolvedLabel?: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const parents = useFaqParents(scope, page, search);

  if (scope === "GLOBAL") {
    return (
      <div className="flex min-h-10 items-end">
        <p className="w-full rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--muted)]">
          النطاق العام يعرض الأسئلة الشائعة للصفحة الرئيسية دون ارتباط بسجل محدد.
        </p>
      </div>
    );
  }

  const options: SearchableSelectOption[] = (parents.data?.items ?? []).map((item) => ({
    value: item.id,
    label: "nameAr" in item ? item.nameAr : item.titleAr,
    sublabel: item.slug,
  }));

  if (value && selectedLabel && !options.some((opt) => opt.value === value)) {
    options.unshift({
      value,
      label: selectedLabel,
    });
  }

  const pagination = parents.data?.pagination;

  return (
    <div className="min-w-0 space-y-1">
      <SearchableSelect
        label={label ?? `السجل المرتبط (${faqScopeLabels[scope]})`}
        value={value}
        onChange={(nextId) => {
          const matched = options.find((opt) => opt.value === nextId);
          onChange(nextId, matched?.label);
        }}
        options={options}
        placeholder="اختر السجل المرتبط"
        clearLabel="إلغاء اختيار السجل"
        searchPlaceholder={
          scope === "SERVICE"
            ? "ابحث ضمن الصفحة الحالية..."
            : `ابحث في ${faqScopeLabels[scope]}...`
        }
        disabled={Boolean(disabled)}
        searchValue={search}
        onSearchChange={
          scope !== "SERVICE"
            ? (q) => {
                setSearch(q);
                setPage(1);
              }
            : undefined
        }
        isLoading={parents.isFetching}
        isError={parents.isError}
        onRetry={() => void parents.refetch()}
        emptyMessage="لا توجد سجلات مطابقة."
        dropdownFooter={
          pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="tabular-nums">
                صفحة {pagination.page} من {pagination.totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-[var(--line)] bg-white px-2 py-0.5 font-medium text-[var(--navy)] disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-[var(--line)] bg-white px-2 py-0.5 font-medium text-[var(--navy)] disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          ) : null
        }
      />
      {scope === "SERVICE" ? (
        <p className="text-[11px] text-[var(--muted)]">
          قائمة الخدمات تدعم التصفح بالصفحات بدون بحث نصي في الخادم.
        </p>
      ) : null}
    </div>
  );
}
