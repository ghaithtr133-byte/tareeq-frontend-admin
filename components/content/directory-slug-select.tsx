"use client";

import { useState } from "react";
import type { DirectoryKind } from "@/lib/api-client/university-management";
import { useDirectoryList } from "@/hook/queries/use-university-management";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface DirectorySlugSelectProps {
  kind: DirectoryKind;
  label: string;
  value: string;
  onChange: (slug: string) => void;
  countryId?: string;
  placeholder?: string;
}

/**
 * Searchable filter selector backed by paginated server directory search without preloading full tables.
 */
export function DirectorySlugSelect({
  kind,
  label,
  value,
  onChange,
  countryId,
  placeholder = "الكل",
}: DirectorySlugSelectProps) {
  const access = useAdminAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const list = useDirectoryList(
    kind,
    {
      page,
      limit: 50,
      search: search.trim() || undefined,
      ...(kind === "cities" && countryId ? { countryId } : {}),
    },
    true,
  );

  const options = (list.data?.items ?? []).map((item) => ({
    value: item.slug,
    label: item.nameAr,
    sublabel: item.nameEn || item.slug,
  }));

  const pagination = list.data?.pagination;

  const footer = access.mockEnabled ? (
    <span className="text-[var(--muted)]">
      تتطلب قائمة {kind === "cities" ? "المدن" : "التخصصات"} الكاملة جلسة خادم متصلة.
    </span>
  ) : pagination && pagination.totalPages > 1 ? (
    <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
      <span className="tabular-nums">
        صفحة {pagination.page} من {pagination.totalPages}
      </span>
      <div className="flex items-center gap-1.5">
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
  ) : null;

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={kind === "cities" ? "ابحث باسم المدينة..." : "ابحث باسم التخصص..."}
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
          ? "لا تتوفر خيارات الدليل في وضع المعاينة المحلية."
          : "لا توجد نتائج مطابقة."
      }
      dropdownFooter={footer}
    />
  );
}

