"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { Country, PublicationStatus } from "@/lib/api-client/content";
import { ContentHardDeleteDialog } from "@/components/content/content-hard-delete-dialog";
import { normalizeApiError } from "@/lib/api-client/error";
import { ErrorState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  MoreVerticalIcon,
  NavigationIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SpinnerIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import { useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentList, useInfiniteContentList } from "@/hook/queries/use-content-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  buildContentFilterUrlParams,
  parseContentListFilters,
  type ListSearchParams,
} from "@/lib/content-filters";
import {
  COUNTRY_STATUS_FILTER_OPTIONS,
  countryFlagFromCode,
  countryPublicationStatusLabel,
  formatCountriesPaginationSummary,
  formatCountryAddedDate,
  hasActiveCountriesFilters,
  isSafeCountryThumbnailUrl,
} from "@/lib/countries-list-helpers";

const statusBadgeStyles: Record<PublicationStatus, string> = {
  DRAFT: "border-amber-200/90 bg-amber-50/90 text-amber-900",
  PUBLISHED: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

function useDesktopLayout() {
  const [desktop, setDesktop] = useState<boolean | undefined>();
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

function CountryStatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${statusBadgeStyles[status]}`}
    >
      {status === "PUBLISHED" ? <CheckIcon className="size-3.5 text-emerald-700" /> : null}
      <span>{countryPublicationStatusLabel(status)}</span>
    </span>
  );
}

function CountryFeaturedIndicator({ featured }: { featured: boolean }) {
  if (featured) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--gold)]/40 bg-[var(--gold-soft)]/75 px-2.5 py-1 text-[13px] font-semibold text-[var(--navy)] whitespace-nowrap">
        <StarIcon className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />
        <span>مميزة</span>
      </span>
    );
  }
  return <span className="text-[13px] font-medium text-[var(--muted)] whitespace-nowrap">غير مميزة</span>;
}

function CountryThumbnail({
  country,
  size = "md",
}: {
  country: Country;
  size?: "sm" | "md";
}) {
  const safeUrl = isSafeCountryThumbnailUrl(country.imageUrl);
  const flag = countryFlagFromCode(country.countryCode);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const sizeClass = size === "sm" ? "size-9" : "size-10";

  if (safeUrl && failedUrl !== safeUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={safeUrl}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(safeUrl)}
        className={`${sizeClass} shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] object-cover`}
      />
    );
  }

  if (flag) {
    return (
      <span
        aria-hidden="true"
        className={`grid ${sizeClass} shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] text-xl leading-none`}
      >
        {flag}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid ${sizeClass} shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--navy)]/65`}
    >
      <NavigationIcon item="countries" className={size === "sm" ? "size-4" : "size-[18px]"} />
    </span>
  );
}

function CountryRowActions({
  country,
  preferDropUp = false,
  isUpdating,
  onToggleFeatured,
  canHardDelete,
  onDelete,
}: {
  country: Country;
  preferDropUp?: boolean;
  isUpdating: boolean;
  onToggleFeatured: (country: Country) => void;
  canHardDelete: boolean;
  onDelete: (country: Country) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1.5">
      <Link
        href={`/admin/countries/${country.id}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--navy)] hover:bg-[var(--navy)] hover:text-white whitespace-nowrap"
      >
        <PencilIcon className="size-3.5" />
        <span>تعديل</span>
      </Link>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`خيارات إضافية لدولة ${country.nameAr}`}
        disabled={isUpdating}
        onClick={() => setMenuOpen((open) => !open)}
        className={`inline-flex size-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          menuOpen
            ? "border-[var(--gold)] bg-[var(--gold-soft)]/50 text-[var(--navy)]"
            : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-strong)] hover:bg-slate-50 hover:text-[var(--navy)]"
        }`}
      >
        {isUpdating ? (
          <SpinnerIcon className="size-4 animate-spin text-[var(--gold-dark)]" />
        ) : (
          <MoreVerticalIcon className="size-4" />
        )}
      </button>

      {menuOpen ? (
        <div
          role="menu"
          aria-label={`إجراءات ${country.nameAr}`}
          className={`absolute left-0 z-30 w-48 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-dropdown)] ${
            preferDropUp ? "bottom-[calc(100%+0.375rem)]" : "top-[calc(100%+0.375rem)]"
          }`}
        >
          <Link
            href={`/admin/countries/${country.id}#content-details`}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[13px] font-medium text-[var(--navy)] transition-colors hover:bg-slate-50"
          >
            <BookOpenIcon className="size-4 shrink-0 text-[var(--muted)]" />
            <span>إدارة دليل الدراسة</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            disabled={isUpdating}
            onClick={() => {
              setMenuOpen(false);
              onToggleFeatured(country);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[13px] font-medium text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <StarIcon
              className={`size-4 shrink-0 ${
                country.featured ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--muted)]"
              }`}
            />
            <span>{country.featured ? "إلغاء التمييز" : "تمييز الدولة"}</span>
          </button>
          {canHardDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); onDelete(country); }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <TrashIcon className="size-4 shrink-0" />
              <span>حذف نهائي</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CountriesTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="جارٍ تحميل الدول">
      {/* Desktop Skeleton */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--line)] bg-[var(--surface-subtle)] px-5 py-3.5">
          <div className="col-span-4 h-3.5 w-16 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 h-3.5 w-20 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 h-3.5 w-16 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 h-3.5 w-20 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 flex justify-end">
            <div className="h-3.5 w-14 animate-pulse rounded bg-slate-200/80" />
          </div>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid min-h-[68px] grid-cols-12 items-center gap-4 px-5 py-3.5">
              <div className="col-span-4 flex items-center gap-3">
                <div className="size-10 shrink-0 animate-pulse rounded-lg bg-slate-200/80" />
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200/80" />
              </div>
              <div className="col-span-2">
                <div className="h-7 w-20 animate-pulse rounded-md bg-slate-100" />
              </div>
              <div className="col-span-2">
                <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="col-span-2 flex justify-end gap-1.5">
                <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
                <div className="size-9 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 animate-pulse rounded-lg bg-slate-200/80" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200/80" />
              </div>
              <div className="h-7 w-20 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
              <div className="h-5 w-20 animate-pulse rounded-md bg-slate-100" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountriesEmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-3.5 grid size-12 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--navy)]">
        {hasFilters ? <SearchIcon className="size-5" /> : <InboxIcon className="size-5" />}
      </div>
      <h3 className="text-lg font-bold text-[var(--navy)]">
        {hasFilters ? "لا توجد دول مطابقة" : "لا توجد دول مضافة بعد"}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[var(--muted)]">
        {hasFilters
          ? "لم يتم العثور على دول تطابق معايير البحث أو التصفية الحالية."
          : "أضف أول دولة لبدء إعداد الوجهات الدراسية وأدلة الدراسة الخاصة بها."}
      </p>
      <div className="mt-5 flex justify-center">
        {hasFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50"
          >
            <RotateCcwIcon className="size-4 text-[var(--muted)]" />
            <span>إعادة ضبط الفلاتر</span>
          </button>
        ) : (
          <Link
            href="/admin/countries/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--navy-light)]"
          >
            <PlusIcon className="size-4" />
            <span>إضافة دولة</span>
          </Link>
        )}
      </div>
    </section>
  );
}

export function CountriesListPage({ searchParams }: { searchParams: ListSearchParams }) {
  const router = useRouter();
  const access = useAdminAccess();
  const pathname = usePathname();
  const desktop = useDesktopLayout();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => parseContentListFilters("countries", searchParams),
    [searchParams],
  );
  const filterValues = filters as Record<string, string | number | undefined>;
  const filtersActive = useMemo(() => hasActiveCountriesFilters(filters), [filters]);

  const desktopFilters = useMemo(() => ({ ...filters, limit: 12 }), [filters]);
  const mobileFilters = useMemo(() => {
    const { page: _page, limit: _limit, ...rest } = desktopFilters;
    void _page;
    void _limit;
    return rest;
  }, [desktopFilters]);
  const list = useContentList("countries", desktopFilters, desktop === true);
  const mobileList = useInfiniteContentList("countries", mobileFilters, 5, desktop === false);
  const updateCountry = useUpdateContent("countries");

  const [resetCount, setResetCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const canHardDelete = !access.mockEnabled && (access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");

  const applyPatch = useCallback(
    (
      patch: Record<string, string | number | undefined>,
      options: { resetPage?: boolean; replace?: boolean } = {},
    ) => {
      const nextParams = buildContentFilterUrlParams(filterValues, patch, {
        resetPage: options.resetPage ?? true,
      });
      const target = `${pathname}?${nextParams.toString()}`;
      if (options.replace) router.replace(target);
      else router.push(target);
    },
    [filterValues, pathname, router],
  );

  const handleDebouncedSearch = useCallback(
    (nextSearch: string) => {
      applyPatch({ search: nextSearch || undefined }, { resetPage: true, replace: true });
    },
    [applyPatch],
  );

  const handleResetFilters = useCallback(() => {
    setResetCount((count) => count + 1);
    setRowError(null);
    router.push(pathname);
  }, [pathname, router]);

  async function handleToggleFeatured(country: Country) {
    setRowError(null);
    setUpdatingId(country.id);
    try {
      await updateCountry.mutateAsync({
        id: country.id,
        input: { featured: !country.featured },
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") {
        setRowError(normalized.message || "تعذّر تحديث حالة التمييز. حاول مرة أخرى.");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const desktopItems = list.data?.items ?? [];
  const mobileItems = useMemo(() => {
    const unique = new Map<string, Country>();
    for (const page of mobileList.data?.pages ?? []) {
      for (const country of page.items) unique.set(country.id, country);
    }
    return [...unique.values()];
  }, [mobileList.data?.pages]);
  const items = desktop ? desktopItems : mobileItems;
  const pagination = list.data?.pagination;
  const paginationSummary = pagination
    ? formatCountriesPaginationSummary(pagination.page, pagination.limit, pagination.total)
    : null;
  const isPending = desktop ? list.isPending : mobileList.isPending;
  const isError = desktop ? list.isError : mobileList.isError;
  const retry = desktop ? () => void list.refetch() : () => void mobileList.refetch();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = mobileList;

  useEffect(() => {
    if (desktop !== false || !sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [desktop, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (desktop === undefined) return <CountriesTableSkeleton />;

  return (
    <section className="space-y-4">
      {/* Compact Header */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--navy)] sm:text-[28px]">
            الدول
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-[var(--muted)]">
            إدارة الدول ومحتواها وحالات نشرها.
          </p>
        </div>

        <Link
          href="/admin/countries/new"
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy-light)] whitespace-nowrap sm:w-auto"
        >
          <PlusIcon className="size-4" />
          <span>إضافة دولة</span>
        </Link>
      </header>

      {/* Wide Independent Search Bar (1000ms Debounce) */}
      <DebouncedSearchBar
        value={filters.search ?? ""}
        onDebouncedChange={handleDebouncedSearch}
        delayMs={1000}
        placeholder="ابحث عن دولة..."
        ariaLabel="ابحث عن دولة"
        isFetching={(desktop ? list.isFetching : mobileList.isFetching) && !isPending}
        resetTrigger={resetCount}
      />

      {/* Simplified Borderless Filter Toolbar (Instant Apply, No Apply Button) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Status Select */}
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="countries-status-filter"
              className="shrink-0 text-[13px] font-semibold text-[var(--navy)]"
            >
              حالة النشر
            </label>
            <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-initial">
              <select
                id="countries-status-filter"
                value={filters.status ?? ""}
                onChange={(event) =>
                  applyPatch({ status: event.target.value || undefined })
                }
                className="h-10 w-full appearance-none rounded-xl border border-[var(--line)] bg-white pr-3 pl-9 text-sm font-medium text-[var(--navy)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
              >
                {COUNTRY_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "ALL"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </div>

          {/* Featured Switch (OFF = omit featured, ON = featured=true) */}
          <div className="sm:min-w-[205px]">
            <SwitchToggle
              id="countries-featured-filter"
              label="عرض المميزة فقط"
              checked={filters.featured === "true"}
              showStarIcon
              onChange={(checked) =>
                applyPatch({ featured: checked ? "true" : undefined })
              }
            />
          </div>
        </div>

        {filtersActive ? (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3.5 text-[13px] font-semibold text-[var(--navy)] shadow-[var(--shadow-card)] transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcwIcon className="size-3.5 text-[var(--muted)]" />
            <span>إعادة ضبط</span>
          </button>
        ) : null}
      </div>

      {/* Inline non-blocking error feedback for row quick-actions */}
      {rowError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
        >
          <span>{rowError}</span>
          <button
            type="button"
            onClick={() => setRowError(null)}
            className="shrink-0 text-xs font-bold underline"
          >
            إخفاء
          </button>
        </div>
      ) : null}

      {/* Loading / Error / Empty / Results */}
      {isPending ? <CountriesTableSkeleton /> : null}

      {isError && items.length === 0 ? (
        <ErrorState
          action={
            <button
              type="button"
              onClick={retry}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"
            >
              إعادة المحاولة
            </button>
          }
        />
      ) : null}

      {!isPending && !isError && items.length === 0 ? (
        <CountriesEmptyState hasFilters={filtersActive} onReset={handleResetFilters} />
      ) : null}

      {!isPending && !(isError && items.length === 0) && items.length > 0 ? (
        <>
          {/* Desktop & Tablet Table */}
          <div className="hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">
            <table className="w-full border-collapse text-right">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[13px] font-semibold text-[var(--muted)]">
                <tr>
                  <th scope="col" className="rounded-tr-2xl px-5 py-3.5">
                    الدولة
                  </th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                    حالة النشر
                  </th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                    التمييز
                  </th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                    تاريخ الإضافة
                  </th>
                  <th scope="col" className="rounded-tl-2xl px-5 py-3.5 text-left whitespace-nowrap">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[15px]">
                {items.map((country, index) => (
                  <tr
                    key={country.id}
                    className="transition-colors hover:bg-[var(--surface-subtle)]/80"
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <CountryThumbnail country={country} />
                        <Link
                          href={`/admin/countries/${country.id}`}
                          className="truncate text-[15px] font-bold text-[var(--navy)] transition-colors hover:text-[var(--gold-dark)] hover:underline"
                        >
                          {country.nameAr}
                        </Link>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <CountryStatusBadge status={country.status} />
                    </td>

                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <CountryFeaturedIndicator featured={country.featured} />
                    </td>

                    <td className="px-4 py-3.5 align-middle text-[14px] text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {formatCountryAddedDate(country.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 text-left align-middle whitespace-nowrap">
                      <CountryRowActions
                        country={country}
                        preferDropUp={items.length > 2 && index >= items.length - 2}
                        isUpdating={updatingId === country.id}
                        onToggleFeatured={(target) => void handleToggleFeatured(target)}
                        canHardDelete={canHardDelete}
                        onDelete={setCountryToDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {items.map((country, index) => (
              <article
                key={country.id}
                className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CountryThumbnail country={country} size="sm" />
                    <Link
                      href={`/admin/countries/${country.id}`}
                      className="truncate text-base font-bold text-[var(--navy)] hover:text-[var(--gold-dark)]"
                    >
                      {country.nameAr}
                    </Link>
                  </div>
                  <CountryStatusBadge status={country.status} />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <CountryFeaturedIndicator featured={country.featured} />
                  <CountryRowActions
                    country={country}
                    preferDropUp={items.length > 2 && index >= items.length - 2}
                    isUpdating={updatingId === country.id}
                    onToggleFeatured={(target) => void handleToggleFeatured(target)}
                    canHardDelete={canHardDelete}
                    onDelete={setCountryToDelete}
                  />
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Footer */}
          {desktop && pagination && paginationSummary ? (
            <nav
              aria-label="صفحات الدول"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"
            >
              <p className="text-[13px] font-medium text-[var(--muted)] sm:text-sm">
                عرض{" "}
                <bdi dir="ltr" className="font-bold text-[var(--navy)] tabular-nums">
                  {paginationSummary.rangeText}
                </bdi>{" "}
                من أصل{" "}
                <strong className="font-bold text-[var(--navy)] tabular-nums">
                  {paginationSummary.total}
                </strong>{" "}
                دولة
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyPatch(
                      { page: pagination.page - 1 },
                      { resetPage: false },
                    )
                  }
                  disabled={pagination.page <= 1 || list.isFetching}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronRightIcon className="size-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPatch(
                      { page: pagination.page + 1 },
                      { resetPage: false },
                    )
                  }
                  disabled={
                    pagination.page >= Math.max(pagination.totalPages, 1) ||
                    list.isFetching
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>التالي</span>
                  <ChevronLeftIcon className="size-4" />
                </button>
              </div>
            </nav>
          ) : null}
          {desktop === false ? (
            <div className="space-y-3 md:hidden">
              <div ref={sentinelRef} aria-hidden="true" />
              {mobileList.isFetchingNextPage ? <CountriesTableSkeleton /> : null}
              {mobileList.isError ? (
                <ErrorState action={<button type="button" onClick={() => void mobileList.refetch()} className="inline-flex h-10 items-center rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white">إعادة المحاولة</button>} />
              ) : mobileList.hasNextPage ? (
                <button type="button" onClick={() => void mobileList.fetchNextPage()} disabled={mobileList.isFetchingNextPage} className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] disabled:opacity-50">تحميل المزيد</button>
              ) : <p className="py-1 text-center text-xs text-[var(--muted)]">تم عرض كل الدول.</p>}
            </div>
          ) : null}
        </>
      ) : null}
      {countryToDelete ? <ContentHardDeleteDialog resource="countries" record={{ id: countryToDelete.id, nameAr: countryToDelete.nameAr }} onClose={() => setCountryToDelete(null)} onDeleted={() => setCountryToDelete(null)} /> : null}
    </section>
  );
}

