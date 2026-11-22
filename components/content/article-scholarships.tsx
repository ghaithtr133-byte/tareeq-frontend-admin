"use client";

import { useState } from "react";
import type { ArticleRelatedScholarship } from "@/lib/api-client/content";
import { useContentList } from "@/hook/queries/use-content-queries";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@/components/ui/admin-icons";

/** The ordered selection is independent of the current lookup page or search. */
export function ArticleScholarships({
  value,
  onChange,
  selected = [],
  disabled,
  error,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  selected?: ArticleRelatedScholarship[];
  disabled: boolean;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [candidate, setCandidate] = useState("");
  const list = useContentList(
    "scholarships",
    { page, limit: 50, search: search.trim() || undefined, sort: "newest" },
    true,
    false,
  );
  const [chosenLabels, setChosenLabels] = useState<Record<string, string>>({});

  function move(index: number, delta: number) {
    const ids = [...value];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    onChange(ids);
  }

  const availableOptions = (list.data?.items ?? [])
    .filter((item) => !value.includes(item.id))
    .map((item) => ({
      value: item.id,
      label: item.titleAr,
      sublabel: item.country?.nameAr ?? undefined,
    }));

  const pagination = list.data?.pagination;

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="text-sm font-bold text-[var(--navy)]">
          المنح المرتبطة بالمقال
        </legend>
        <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
          {value.length} / 50 منحة
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <SearchableSelect
          label="اختيار منحة للربط"
          value={candidate}
          onChange={setCandidate}
          options={availableOptions}
          placeholder="ابحث واختر منحة لإضافتها..."
          searchPlaceholder="ابحث بعنوان المنحة..."
          searchValue={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          isLoading={list.isFetching}
          isError={list.isError}
          onRetry={() => void list.refetch()}
          emptyMessage="لا توجد منح متاحة مطابقة."
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

        <button
          type="button"
          disabled={
            !candidate ||
            value.includes(candidate) ||
            value.length >= 50 ||
            list.isFetching ||
            list.isError
          }
          onClick={() => {
            const item = list.data?.items.find((entry) => entry.id === candidate);
            if (!item || value.includes(candidate) || value.length >= 50) return;
            setChosenLabels((old) => ({ ...old, [item.id]: item.titleAr }));
            onChange([...value, candidate]);
            setCandidate("");
          }}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--navy)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
        >
          <PlusIcon className="size-4" />
          <span>إضافة المنحة</span>
        </button>
      </div>

      {value.length ? (
        <div className="space-y-2">
          <ol className="space-y-2">
            {value.map((id, index) => (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)]"
              >
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--navy)]">
                  <span className="ml-2 font-bold text-[var(--gold-dark)] tabular-nums">
                    {index + 1}.
                  </span>
                  {list.data?.items.find((item) => item.id === id)?.titleAr ??
                    chosenLabels[id] ??
                    selected.find((item) => item.id === id)?.titleAr ??
                    `${id} (مختارة)`}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`رفع المنحة ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ArrowUpIcon className="size-3.5" />
                    <span>أعلى</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`خفض المنحة ${index + 1}`}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ArrowDownIcon className="size-3.5" />
                    <span>أسفل</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`إزالة المنحة ${index + 1}`}
                    onClick={() => onChange(value.filter((item) => item !== id))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="size-3.5" />
                    <span>إزالة</span>
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("مسح جميع ارتباطات المنح؟")) onChange([]);
            }}
            className="text-xs font-semibold text-red-700 underline-offset-4 hover:underline"
          >
            مسح جميع ارتباطات المنح
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">لا توجد منح مرتبطة بهذا المقال حاليًا.</p>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
