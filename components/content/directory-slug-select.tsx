"use client";

import type { DirectoryKind } from "@/lib/api-client/university-management";
import { useDirectorySelector } from "@/hook/queries/use-university-management";
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
  const selector = useDirectorySelector(
    kind,
    {
      available: kind !== "cities" || Boolean(countryId),
      params: kind === "cities" && countryId ? { countryId } : {},
    },
  );

  const options = selector.items.map((item) => ({
    value: item.slug,
    label: item.nameAr,
    sublabel: item.nameEn || item.slug,
  }));

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={kind === "cities" ? "ابحث في جميع المدن..." : "ابحث في جميع التخصصات..."}
      searchValue={selector.search}
      onSearchChange={selector.setSearch}
      onOpenChange={selector.setOpen}
      isLoading={!access.mockEnabled && (selector.isFetching || selector.isSearchPending)}
      isError={!access.mockEnabled && selector.isError}
      onRetry={() => void selector.refetch()}
      hasMore={!selector.isSearchPending && Boolean(selector.hasNextPage)}
      isLoadingMore={selector.isFetchingNextPage}
      onLoadMore={() => void selector.fetchNextPage()}
      endMessage={kind === "cities" ? "تم عرض جميع المدن المطابقة." : "تم عرض جميع التخصصات المطابقة."}
      emptyMessage={
        access.mockEnabled
          ? "لا تتوفر خيارات الدليل في وضع المعاينة المحلية."
          : "لا توجد نتائج مطابقة."
      }
    />
  );
}

