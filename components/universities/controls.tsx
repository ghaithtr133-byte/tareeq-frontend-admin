"use client";

import { useState } from "react";
import type { ManagementPage, DirectoryKind } from "@/lib/api-client/university-management";
import { useDirectoryList } from "@/hook/queries/use-university-management";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { uuidSchema } from "@/lib/university-schemas";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/admin-icons";

export const inputClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--navy)] placeholder:text-[var(--muted)]/80 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--navy)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

export const panelClass =
  "space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5";

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-semibold text-[var(--navy)]">{label}</p>
      {children}
    </div>
  );
}

export function PageControls({
  data,
  change,
}: {
  data?: ManagementPage<unknown>;
  change: (page: number) => void;
}) {
  if (!data) return null;
  const { page, totalPages, total } = data.pagination;
  return (
    <nav
      aria-label="صفحات السجلات"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"
    >
      <span className="text-xs font-medium text-[var(--muted)] tabular-nums">
        صفحة <strong className="text-[var(--navy)]">{page}</strong> من{" "}
        <strong className="text-[var(--navy)]">{Math.max(1, totalPages)}</strong> ·{" "}
        <strong className="text-[var(--navy)]">{total}</strong> سجل
      </span>
      <div className="flex items-center gap-2">
        <button
          className={buttonClass}
          type="button"
          disabled={page <= 1}
          onClick={() => change(page - 1)}
        >
          <ChevronRightIcon className="size-4" />
          <span>السابق</span>
        </button>
        <button
          className={buttonClass}
          type="button"
          disabled={page >= totalPages}
          onClick={() => change(page + 1)}
        >
          <span>التالي</span>
          <ChevronLeftIcon className="size-4" />
        </button>
      </div>
    </nav>
  );
}

/** Retain the selected UUID even outside the current server-side search page. */
export function DirectorySelector({
  kind,
  value,
  onChange,
  countryId,
  label,
  selectedLabel,
  disabled,
}: {
  kind: DirectoryKind;
  value: string;
  onChange: (value: string) => void;
  countryId?: string;
  label: string;
  selectedLabel?: string;
  disabled?: boolean;
}) {
  const access = useAdminAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const validCountryId = uuidSchema.safeParse(countryId).success ? countryId : undefined;
  const enabled = !disabled && (kind !== "cities" || Boolean(validCountryId));

  const list = useDirectoryList(
    kind,
    {
      page,
      limit: 50,
      search: search.trim() || undefined,
      ...(kind === "cities" ? { countryId: validCountryId } : {}),
    },
    enabled,
  );

  const items = list.data?.items ?? [];
  const options: SearchableSelectOption[] = items.map((item) => ({
    value: item.id,
    label: item.nameAr,
    sublabel: item.nameEn || item.slug,
  }));

  if (value && !options.some((opt) => opt.value === value)) {
    options.unshift({
      value,
      label: selectedLabel ?? `${value} (مختار)`,
    });
  }

  const pagination = list.data?.pagination;

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={kind === "cities" && !countryId ? "اختر الدولة أولًا" : "بلا اختيار"}
      clearLabel="بلا اختيار"
      searchPlaceholder={kind === "cities" ? "ابحث باسم المدينة..." : "ابحث باسم التخصص..."}
      disabled={disabled || (kind === "cities" && !countryId)}
      searchValue={search}
      onSearchChange={(q) => {
        setSearch(q);
        setPage(1);
      }}
      isLoading={!access.mockEnabled && list.isFetching}
      isError={!access.mockEnabled && list.isError}
      onRetry={() => void list.refetch()}
      emptyMessage={
        access.mockEnabled
          ? "قائمة الدليل تتطلب جلسة خادم متصلة."
          : "لا توجد نتائج مطابقة."
      }
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
  );
}
