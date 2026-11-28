"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type {
  PublicationStatus,
  Scholarship,
  ScholarshipApplicationStatus,
  ScholarshipListParams,
} from "@/lib/api-client/content";
import { ContentHardDeleteDialog } from "@/components/content/content-hard-delete-dialog";
import { normalizeApiError } from "@/lib/api-client/error";
import { useScholarshipOptionCatalog } from "@/components/content/scholarship-options-modal";
import { ErrorState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SortableTableHeader } from "@/components/ui/sortable-table-header";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  InboxIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SpinnerIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import { useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentList, useContentSelector, useInfiniteContentList } from "@/hook/queries/use-content-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import type { ListSearchParams } from "@/lib/content-filters";
import { scholarshipOptionDisplayLabel } from "@/lib/scholarship-form-helpers";
import {
  SCHOLARSHIP_APPLICATION_STATUS_FILTER_OPTIONS,
  SCHOLARSHIP_SORT_OPTIONS,
  SCHOLARSHIP_STATUS_FILTER_OPTIONS,
  buildScholarshipsFilterUrlParams,
  countActiveScholarshipsSecondaryFilters,
  formatScholarshipDeadline,
  formatScholarshipUpdatedAt,
  formatScholarshipsPaginationSummary,
  hasActiveScholarshipsFilters,
  parseScholarshipsListFilters,
  scholarshipApplicationStatusLabel,
  scholarshipPublicationStatusLabel,
} from "@/lib/scholarships-list-helpers";

const publicationBadgeStyles: Record<PublicationStatus, string> = {
  DRAFT: "border-amber-200/90 bg-amber-50/90 text-amber-900",
  PUBLISHED: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

const applicationBadgeStyles: Record<ScholarshipApplicationStatus, string> = {
  OPEN: "border-teal-200/90 bg-teal-50/90 text-teal-900",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
};

function useDesktopLayout() {
  const [desktop, setDesktop] = useState<boolean | undefined>();
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${publicationBadgeStyles[status]}`}
    >
      {status === "PUBLISHED" ? <CheckIcon className="size-3.5 text-emerald-700" /> : null}
      <span>{scholarshipPublicationStatusLabel(status)}</span>
    </span>
  );
}

function ApplicationStatusBadge({ status }: { status: ScholarshipApplicationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${applicationBadgeStyles[status]}`}
    >
      {scholarshipApplicationStatusLabel(status)}
    </span>
  );
}

function ScholarshipDeadlineCell({ verifiedDeadline }: { verifiedDeadline: string | null }) {
  const deadline = formatScholarshipDeadline(verifiedDeadline);
  if (!deadline.isSpecified) {
    return <span className="text-[14px] text-[var(--muted)] whitespace-nowrap">غير محدد</span>;
  }

  if (deadline.isExpired) {
    return (
      <div className="inline-flex flex-wrap items-center gap-1.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-rose-800 tabular-nums">
          <CalendarIcon className="size-3.5 shrink-0 text-rose-700" />
          <span>{deadline.label}</span>
        </span>
        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-800">
          منتهي
        </span>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--navy)] tabular-nums whitespace-nowrap">
      <CalendarIcon className="size-3.5 shrink-0 text-[var(--gold-dark)]" />
      <span>{deadline.label}</span>
    </span>
  );
}

function ScholarshipRowActions({
  scholarship,
  preferDropUp = false,
  isUpdating,
  onToggleFeatured,
  canHardDelete,
  onDelete,
}: {
  scholarship: Scholarship;
  preferDropUp?: boolean;
  isUpdating: boolean;
  onToggleFeatured: (scholarship: Scholarship) => void;
  canHardDelete: boolean;
  onDelete: (scholarship: Scholarship) => void;
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
        href={`/admin/scholarships/${scholarship.id}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--navy)] hover:bg-[var(--navy)] hover:text-white whitespace-nowrap"
      >
        <PencilIcon className="size-3.5" />
        <span>تعديل</span>
      </Link>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`خيارات إضافية لمنحة ${scholarship.titleAr}`}
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
          aria-label={`إجراءات ${scholarship.titleAr}`}
          className={`absolute left-0 z-30 w-52 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-dropdown)] ${
            preferDropUp ? "bottom-[calc(100%+0.375rem)]" : "top-[calc(100%+0.375rem)]"
          }`}
        >
          <Link
            href={`/admin/faqs?scope=SCHOLARSHIP&parentId=${scholarship.id}`}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[13px] font-medium text-[var(--navy)] transition-colors hover:bg-slate-50"
          >
            <HelpCircleIcon className="size-4 shrink-0 text-[var(--muted)]" />
            <span>الأسئلة الشائعة للمنحة</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            disabled={isUpdating}
            onClick={() => {
              setMenuOpen(false);
              onToggleFeatured(scholarship);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[13px] font-medium text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <StarIcon
              className={`size-4 shrink-0 ${
                scholarship.featured ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--muted)]"
              }`}
            />
            <span>{scholarship.featured ? "إلغاء التمييز" : "تمييز المنحة"}</span>
          </button>
          {canHardDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); onDelete(scholarship); }}
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

function ScholarshipsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="جارٍ تحميل المنح الدراسية">
      {/* Desktop Table Skeleton */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] lg:block">
        <div className="grid grid-cols-12 items-center gap-3 border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3.5">
          <div className="col-span-4 h-3.5 w-20 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 h-3.5 w-24 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 h-3.5 w-20 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-1 h-3.5 w-14 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-1 h-3.5 w-14 animate-pulse rounded bg-slate-200/80" />
          <div className="col-span-2 flex justify-end">
            <div className="h-3.5 w-14 animate-pulse rounded bg-slate-200/80" />
          </div>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid min-h-[72px] grid-cols-12 items-center gap-3 px-4 py-3.5">
              <div className="col-span-4 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-200/80" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="col-span-2">
                <div className="h-7 w-24 animate-pulse rounded-md bg-slate-100" />
              </div>
              <div className="col-span-1">
                <div className="h-7 w-16 animate-pulse rounded-md bg-slate-100" />
              </div>
              <div className="col-span-1">
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="col-span-2 flex justify-end gap-1.5">
                <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
                <div className="size-9 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile & Tablet Card Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-44 animate-pulse rounded bg-slate-200/80" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-7 w-16 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-24 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScholarshipsEmptyState({
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
        {hasFilters ? "لا توجد منح مطابقة" : "لا توجد منح دراسية مضافة بعد"}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[var(--muted)]">
        {hasFilters
          ? "لم يتم العثور على منح دراسية تطابق معايير البحث أو التصفية الحالية."
          : "أضف أول منحة دراسية لبدء إدارة المواعيد النهائية وشروط التقديم وحالات النشر."}
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
            href="/admin/scholarships/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--navy-light)]"
          >
            <PlusIcon className="size-4" />
            <span>إضافة منحة</span>
          </Link>
        )}
      </div>
    </section>
  );
}

export function ScholarshipsListPage({ searchParams }: { searchParams: ListSearchParams }) {
  const router = useRouter();
  const access = useAdminAccess();
  const pathname = usePathname();
  const desktop = useDesktopLayout();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => parseScholarshipsListFilters(searchParams),
    [searchParams],
  );
  const secondaryActiveCount = useMemo(
    () => countActiveScholarshipsSecondaryFilters(filters),
    [filters],
  );
  const filtersActive = useMemo(() => hasActiveScholarshipsFilters(filters), [filters]);

  const mobileFilters = useMemo(() => {
    const { page: _page, limit: _limit, ...rest } = filters;
    void _page;
    void _limit;
    return rest;
  }, [filters]);
  const list = useContentList("scholarships", filters, desktop === true);
  const mobileList = useInfiniteContentList("scholarships", mobileFilters, 5, desktop === false);
  const countrySelector = useContentSelector("countries", "manual");
  const universitySelectorParams = useMemo(
    () => (filters.country ? { country: filters.country } : {}),
    [filters.country],
  );
  const universitySelector = useContentSelector("universities", "name", {
    params: universitySelectorParams,
  });
  const updateScholarship = useUpdateContent("scholarships");

  const studyLevelCatalog = useScholarshipOptionCatalog("studyLevel");
  const fundingTypeCatalog = useScholarshipOptionCatalog("fundingType");

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(() => secondaryActiveCount > 0);
  const [prevSecondaryCount, setPrevSecondaryCount] = useState(secondaryActiveCount);
  if (secondaryActiveCount !== prevSecondaryCount) {
    setPrevSecondaryCount(secondaryActiveCount);
    if (secondaryActiveCount > 0) {
      setMoreFiltersOpen(true);
    }
  }

  const [resetCount, setResetCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [scholarshipToDelete, setScholarshipToDelete] = useState<Scholarship | null>(null);
  const canHardDelete = !access.mockEnabled && (access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");

  const applyPatch = useCallback(
    (
      patch: Partial<Record<keyof ScholarshipListParams, string | number | undefined>>,
      options: { resetPage?: boolean; replace?: boolean } = {},
    ) => {
      const nextParams = buildScholarshipsFilterUrlParams(filters, patch, {
        resetPage: options.resetPage ?? true,
      });
      const target = `${pathname}?${nextParams.toString()}`;
      if (options.replace) router.replace(target);
      else router.push(target);
    },
    [filters, pathname, router],
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

  async function handleToggleFeatured(scholarship: Scholarship) {
    setRowError(null);
    setUpdatingId(scholarship.id);
    try {
      await updateScholarship.mutateAsync({
        id: scholarship.id,
        input: { featured: !scholarship.featured },
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

  const countryOptions = useMemo(
    () =>
      countrySelector.items.map((item) => ({
        value: item.slug,
        label: item.nameAr,
      })),
    [countrySelector.items],
  );

  const universityOptions = useMemo(() => {
    return universitySelector.items.map((item) => ({
      value: item.slug,
      label: item.nameAr,
      sublabel: item.country?.nameAr
        ? `${item.country.nameAr} · ${item.cityAr}`
        : item.cityAr,
    }));
  }, [universitySelector.items]);

  const studyLevelOptions = useMemo(() => {
    const merged = [...studyLevelCatalog.options];
    const current = filters.studyLevel?.trim() ?? "";
    if (current && !merged.includes(current)) {
      merged.unshift(current);
    }
    return merged.map((value) => ({
      value,
      label: scholarshipOptionDisplayLabel("studyLevel", value),
    }));
  }, [studyLevelCatalog.options, filters.studyLevel]);

  const fundingTypeOptions = useMemo(() => {
    const merged = [...fundingTypeCatalog.options];
    const current = filters.fundingType?.trim() ?? "";
    if (current && !merged.includes(current)) {
      merged.unshift(current);
    }
    return merged.map((value) => ({
      value,
      label: scholarshipOptionDisplayLabel("fundingType", value),
    }));
  }, [fundingTypeCatalog.options, filters.fundingType]);

  const desktopItems = list.data?.items ?? [];
  const mobileItems = useMemo(() => {
    const unique = new Map<string, Scholarship>();
    for (const page of mobileList.data?.pages ?? []) {
      for (const scholarship of page.items) unique.set(scholarship.id, scholarship);
    }
    return [...unique.values()];
  }, [mobileList.data?.pages]);
  const items = desktop ? desktopItems : mobileItems;
  const pagination = list.data?.pagination;
  const paginationSummary = pagination
    ? formatScholarshipsPaginationSummary(pagination.page, pagination.limit, pagination.total)
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

  if (desktop === undefined) return <ScholarshipsTableSkeleton />;

  return (
    <section className="space-y-4">
      {/* Compact Header matching Countries List */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--navy)] sm:text-[28px]">
            المنح الدراسية
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-[var(--muted)]">
            إدارة المنح ومواعيد التقديم وحالات النشر.
          </p>
        </div>

        <Link
          href="/admin/scholarships/new"
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy-light)] whitespace-nowrap sm:w-auto"
        >
          <PlusIcon className="size-4" />
          <span>إضافة منحة</span>
        </Link>
      </header>

      {/* Independent Search Bar (1000ms Debounce) */}
      <DebouncedSearchBar
        value={filters.search ?? ""}
        onDebouncedChange={handleDebouncedSearch}
        delayMs={1000}
        placeholder="ابحث عن منحة..."
        ariaLabel="ابحث عن منحة"
        isFetching={(desktop ? list.isFetching : mobileList.isFetching) && !isPending}
        resetTrigger={resetCount}
      />

      {/* Primary Filters (All Searchable, Immediate Apply, No Apply Button) */}
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchableSelect
            id="scholarships-country-filter"
            label="دولة المنحة"
            value={filters.country ?? ""}
            onChange={(value) => applyPatch({ country: value || undefined })}
            options={countryOptions}
            placeholder="الكل"
            clearLabel="الكل"
            searchPlaceholder="ابحث في جميع الدول..."
            searchValue={countrySelector.search}
            onSearchChange={countrySelector.setSearch}
            onOpenChange={countrySelector.setOpen}
            isLoading={countrySelector.isFetching || countrySelector.isSearchPending}
            isError={countrySelector.isError}
            onRetry={() => void countrySelector.refetch()}
            hasMore={!countrySelector.isSearchPending && Boolean(countrySelector.hasNextPage)}
            isLoadingMore={countrySelector.isFetchingNextPage}
            onLoadMore={() => void countrySelector.fetchNextPage()}
            endMessage="تم عرض جميع الدول المطابقة."
          />

          <SearchableSelect
            id="scholarships-status-filter"
            label="حالة النشر"
            value={filters.status ?? ""}
            onChange={(value) => applyPatch({ status: value || undefined })}
            options={SCHOLARSHIP_STATUS_FILTER_OPTIONS}
            placeholder="جميع الحالات"
            clearLabel="جميع الحالات"
            searchPlaceholder="ابحث في حالات النشر..."
          />

          <SearchableSelect
            id="scholarships-application-status-filter"
            label="حالة التقديم"
            value={filters.applicationStatus ?? ""}
            onChange={(value) => applyPatch({ applicationStatus: value || undefined })}
            options={SCHOLARSHIP_APPLICATION_STATUS_FILTER_OPTIONS}
            placeholder="جميع الحالات"
            clearLabel="جميع الحالات"
            searchPlaceholder="ابحث في حالات التقديم..."
          />

          <div className="lg:hidden">
            <SearchableSelect
              id="scholarships-sort-filter"
              label="ترتيب حسب"
              value={filters.sort ?? "newest"}
              onChange={(value) => applyPatch({ sort: value || "newest" })}
              options={SCHOLARSHIP_SORT_OPTIONS}
              allowClear={false}
              placeholder="الأحدث إضافةً"
              searchPlaceholder="ابحث في خيارات الترتيب..."
            />
          </div>
        </div>

        {/* Featured Switch + Collapsible Additional Filters Trigger + Reset */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="sm:min-w-[205px]">
              <SwitchToggle
                id="scholarships-featured-filter"
                label="عرض المميزة فقط"
                checked={filters.featured === "true"}
                showStarIcon
                onChange={(checked) =>
                  applyPatch({ featured: checked ? "true" : undefined })
                }
              />
            </div>

            <button
              type="button"
              aria-expanded={moreFiltersOpen}
              onClick={() => setMoreFiltersOpen((open) => !open)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold shadow-[var(--shadow-card)] transition-colors whitespace-nowrap ${
                moreFiltersOpen || secondaryActiveCount > 0
                  ? "border-[var(--gold)] bg-[var(--gold-soft)]/55 text-[var(--navy)]"
                  : "border-[var(--line)] bg-white text-[var(--navy)] hover:bg-slate-50"
              }`}
            >
              <span>فلاتر إضافية</span>
              {secondaryActiveCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-[var(--navy)] px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                  {secondaryActiveCount}
                </span>
              ) : null}
              <ChevronDownIcon
                className={`size-4 text-[var(--muted)] transition-transform duration-150 ${
                  moreFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
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

        {/* Collapsible Additional Filters (University, Study Level, Funding Type) */}
        {moreFiltersOpen ? (
          <div className="space-y-2.5 rounded-2xl border border-[var(--line)] bg-white p-3.5 shadow-[var(--shadow-card)] sm:p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SearchableSelect
                id="scholarships-university-filter"
                label="الجامعة المرتبطة"
                value={filters.university ?? ""}
                onChange={(value) => applyPatch({ university: value || undefined })}
                options={universityOptions}
                placeholder="الكل"
                clearLabel="الكل"
                searchPlaceholder="ابحث في جميع الجامعات..."
                searchValue={universitySelector.search}
                onSearchChange={universitySelector.setSearch}
                onOpenChange={universitySelector.setOpen}
                isLoading={universitySelector.isFetching || universitySelector.isSearchPending}
                isError={universitySelector.isError}
                onRetry={() => void universitySelector.refetch()}
                hasMore={!universitySelector.isSearchPending && Boolean(universitySelector.hasNextPage)}
                isLoadingMore={universitySelector.isFetchingNextPage}
                onLoadMore={() => void universitySelector.fetchNextPage()}
                endMessage="تم عرض جميع الجامعات المطابقة."
              />

              <SearchableSelect
                id="scholarships-study-level-filter"
                label="المستوى الدراسي"
                value={filters.studyLevel ?? ""}
                onChange={(value) => applyPatch({ studyLevel: value || undefined })}
                options={studyLevelOptions}
                placeholder="جميع المستويات"
                clearLabel="جميع المستويات"
                searchPlaceholder="ابحث في المستويات..."
              />

              <SearchableSelect
                id="scholarships-funding-type-filter"
                label="نوع التمويل"
                value={filters.fundingType ?? ""}
                onChange={(value) => applyPatch({ fundingType: value || undefined })}
                options={fundingTypeOptions}
                placeholder="جميع الأنواع"
                clearLabel="جميع الأنواع"
                searchPlaceholder="ابحث في أنواع التمويل..."
              />
            </div>

            {studyLevelCatalog.isDesignOnlyCatalog || fundingTypeCatalog.isDesignOnlyCatalog ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                تعتمد خيارات المستوى الدراسي ونوع التمويل على القائمة الموحدة المعتمدة حاليًا بانتظار
                ربط جلب الكتالوج من الخادم في الواجهة.
              </p>
            ) : null}
          </div>
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
      {isPending ? <ScholarshipsTableSkeleton /> : null}

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
        <ScholarshipsEmptyState hasFilters={filtersActive} onReset={handleResetFilters} />
      ) : null}

      {!isPending && !(isError && items.length === 0) && items.length > 0 ? (
        <>
          {/* Desktop 6-Column Table */}
          <div className="hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] lg:block">
            <table className="w-full border-collapse text-right">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[13px] font-semibold text-[var(--muted)]">
                <tr>
                  <SortableTableHeader
                    label="المنحة"
                    active={(filters.sort ?? "newest") === "newest"}
                    direction="descending"
                    onSort={() => applyPatch({ sort: "newest" })}
                    className="rounded-tr-2xl px-4 py-3.5 xl:px-5"
                  />
                  <SortableTableHeader
                    label="آخر موعد للتقديم"
                    active={filters.sort === "deadline"}
                    direction="ascending"
                    onSort={() => applyPatch({ sort: "deadline" })}
                    className="px-3.5 py-3.5 xl:px-4"
                  />
                  <th scope="col" className="px-3.5 py-3.5 whitespace-nowrap xl:px-4">
                    حالة التقديم
                  </th>
                  <th scope="col" className="px-3.5 py-3.5 whitespace-nowrap xl:px-4">
                    حالة النشر
                  </th>
                  <th scope="col" className="px-3.5 py-3.5 whitespace-nowrap xl:px-4">
                    آخر تحديث
                  </th>
                  <th scope="col" className="rounded-tl-2xl px-4 py-3.5 text-left whitespace-nowrap xl:px-5">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[15px]">
                {desktopItems.map((scholarship, index) => {
                  const effectiveAppStatus =
                    scholarship.effectiveApplicationStatus ?? scholarship.applicationStatus;
                  const contextParts = [
                    scholarship.country?.nameAr,
                    scholarship.university?.nameAr,
                  ].filter(Boolean);

                  return (
                    <tr
                      key={scholarship.id}
                      className="transition-colors hover:bg-[var(--surface-subtle)]/80"
                    >
                      <td className="max-w-[300px] px-4 py-3.5 align-middle xl:max-w-sm xl:px-5">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/scholarships/${scholarship.id}`}
                              className="truncate text-[15px] font-bold text-[var(--navy)] transition-colors hover:text-[var(--gold-dark)] hover:underline"
                            >
                              {scholarship.titleAr}
                            </Link>
                            {scholarship.featured ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--gold)]/40 bg-[var(--gold-soft)]/75 px-2 py-0.5 text-[12px] font-semibold text-[var(--navy)] whitespace-nowrap">
                                <StarIcon className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                                <span>مميزة</span>
                              </span>
                            ) : null}
                          </div>

                          {contextParts.length > 0 ? (
                            <p className="truncate text-[13px] text-[var(--muted)]">
                              {contextParts.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-3.5 py-3.5 align-middle xl:px-4">
                        <ScholarshipDeadlineCell verifiedDeadline={scholarship.verifiedDeadline} />
                      </td>

                      <td className="px-3.5 py-3.5 align-middle whitespace-nowrap xl:px-4">
                        <ApplicationStatusBadge status={effectiveAppStatus} />
                      </td>

                      <td className="px-3.5 py-3.5 align-middle whitespace-nowrap xl:px-4">
                        <PublicationStatusBadge status={scholarship.status} />
                      </td>

                      <td className="px-3.5 py-3.5 align-middle text-[14px] text-[var(--muted)] tabular-nums whitespace-nowrap xl:px-4">
                        {formatScholarshipUpdatedAt(scholarship.updatedAt)}
                      </td>

                      <td className="px-4 py-3.5 text-left align-middle whitespace-nowrap xl:px-5">
                        <ScholarshipRowActions
                          scholarship={scholarship}
                          preferDropUp={desktopItems.length > 2 && index >= desktopItems.length - 2}
                          isUpdating={updatingId === scholarship.id}
                          onToggleFeatured={(target) => void handleToggleFeatured(target)}
                          canHardDelete={canHardDelete}
                          onDelete={setScholarshipToDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Compact Cards (< 1024px) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {mobileItems.map((scholarship, index) => {
              const effectiveAppStatus =
                scholarship.effectiveApplicationStatus ?? scholarship.applicationStatus;
              const contextParts = [
                scholarship.country?.nameAr,
                scholarship.university?.nameAr,
              ].filter(Boolean);

              return (
                <article
                  key={scholarship.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/admin/scholarships/${scholarship.id}`}
                          className="block break-words text-[15px] font-bold leading-6 text-[var(--navy)] hover:text-[var(--gold-dark)]"
                        >
                          {scholarship.titleAr}
                        </Link>
                        {contextParts.length > 0 ? (
                          <p className="truncate text-[13px] text-[var(--muted)]">
                            {contextParts.join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <PublicationStatusBadge status={scholarship.status} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ApplicationStatusBadge status={effectiveAppStatus} />
                        {scholarship.featured ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--gold)]/40 bg-[var(--gold-soft)]/75 px-2 py-0.5 text-[12px] font-semibold text-[var(--navy)] whitespace-nowrap">
                            <StarIcon className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                            <span>مميزة</span>
                          </span>
                        ) : null}
                      </div>

                      <ScholarshipDeadlineCell verifiedDeadline={scholarship.verifiedDeadline} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                    <span className="text-[13px] text-[var(--muted)] tabular-nums">
                      تحديث: {formatScholarshipUpdatedAt(scholarship.updatedAt)}
                    </span>
                    <ScholarshipRowActions
                      scholarship={scholarship}
                      preferDropUp={mobileItems.length > 2 && index >= mobileItems.length - 2}
                      isUpdating={updatingId === scholarship.id}
                      onToggleFeatured={(target) => void handleToggleFeatured(target)}
                      canHardDelete={canHardDelete}
                      onDelete={setScholarshipToDelete}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Footer (Fixed limit=12, No page-size selector) */}
          {desktop && pagination && paginationSummary ? (
            <nav
              aria-label="صفحات المنح الدراسية"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-[var(--muted)] sm:text-sm">
                <span>
                  عرض{" "}
                  <bdi dir="ltr" className="font-bold text-[var(--navy)] tabular-nums">
                    {paginationSummary.rangeText}
                  </bdi>{" "}
                  من أصل{" "}
                  <strong className="font-bold text-[var(--navy)] tabular-nums">
                    {paginationSummary.total}
                  </strong>{" "}
                  منحة
                </span>
                <span aria-hidden="true" className="text-[var(--line-strong)]">
                  ·
                </span>
                <span className="tabular-nums">
                  صفحة <strong className="font-bold text-[var(--navy)]">{pagination.page}</strong> من{" "}
                  <strong className="font-bold text-[var(--navy)]">
                    {Math.max(pagination.totalPages, 1)}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
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
            <div className="space-y-3 lg:hidden">
              <div ref={sentinelRef} aria-hidden="true" />
              {mobileList.isFetchingNextPage ? <ScholarshipsTableSkeleton /> : null}
              {mobileList.isError ? (
                <ErrorState action={<button type="button" onClick={() => void mobileList.refetch()} className="inline-flex h-10 items-center rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white">إعادة المحاولة</button>} />
              ) : mobileList.hasNextPage ? (
                <button type="button" onClick={() => void mobileList.fetchNextPage()} disabled={mobileList.isFetchingNextPage} className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] disabled:opacity-50">تحميل المزيد</button>
              ) : <p className="py-1 text-center text-xs text-[var(--muted)]">تم عرض كل المنح.</p>}
            </div>
          ) : null}
        </>
      ) : null}
      {scholarshipToDelete ? <ContentHardDeleteDialog resource="scholarships" record={{ id: scholarshipToDelete.id, nameAr: scholarshipToDelete.titleAr }} onClose={() => setScholarshipToDelete(null)} onDeleted={() => setScholarshipToDelete(null)} /> : null}
    </section>
  );
}

