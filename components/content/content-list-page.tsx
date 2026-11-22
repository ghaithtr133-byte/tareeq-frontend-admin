"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type {
  AdminContentResource,
  Article,
  ContentRecord,
  Country,
  Scholarship,
  Service,
  University,
} from "@/lib/api-client/content";
import { EmptyState, ErrorState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import { DirectorySlugSelect } from "@/components/content/directory-slug-select";
import { useScholarshipOptionCatalog } from "@/components/content/scholarship-options-modal";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  StarIcon,
} from "@/components/ui/admin-icons";
import { useContentList, useContentSelectors } from "@/hook/queries/use-content-queries";
import {
  contentDefinitions,
  contentTitle,
  publicationStatusOptions,
} from "@/lib/content-config";
import {
  buildContentFilterUrlParams,
  countActiveContentFilters,
  parseContentListFilters,
  scholarshipUniversityFilterNames,
  type ListSearchParams,
} from "@/lib/content-filters";
import {
  programStudyLevelLabels,
  studyLevelLabel,
  teachingLanguageLabels,
  universityTypeLabel,
} from "@/lib/content-labels";
import { programStudyLevels, teachingLanguages } from "@/lib/university-schemas";

const resourceDescriptions: Record<AdminContentResource, string> = {
  countries: "استعراض وتحديث صفحات الوجهات الدراسية وأدلة الدراسة الخاصة بكل دولة.",
  universities: "إدارة بيانات الجامعات والربط الجغرافي بالمدن والتخصصات والبرامج.",
  scholarships: "متابعة المنح الدراسية ومواعيد التقديم والمستويات وأنواع التمويل.",
  services: "إدارة الخدمات الاستشارية والأكاديمية ومحتواها التفصيلي.",
  articles: "تحرير المقالات التعليمية وربطها بالدول والمنح الدراسية.",
};

const searchPlaceholders: Record<AdminContentResource, string> = {
  countries: "ابحث باسم الدولة العربية أو الإنجليزية أو المعرّف النصي...",
  universities: "ابحث باسم الجامعة أو المدينة...",
  scholarships: "ابحث بعنوان المنحة الدراسية...",
  services: "البحث النصي غير متاح للخدمات في الخادم حاليًا",
  articles: "ابحث بعنوان المقال...",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

function TableSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="جارٍ تحميل البيانات"
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)]"
    >
      <div className="border-b border-[var(--line)] bg-[var(--surface-subtle)] px-5 py-3.5">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-[var(--line)]">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 items-center gap-4 px-5 py-4">
            <div className="col-span-5 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/80" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="col-span-3">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="col-span-2">
              <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="col-span-2 flex justify-end">
              <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordDetailsCell({
  resource,
  record,
}: {
  resource: AdminContentResource;
  record: ContentRecord;
}) {
  if (resource === "countries") {
    const item = record as Country;
    return (
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm text-[var(--navy)]">
          <bdi dir="ltr">{item.nameEn ?? "—"}</bdi>
        </p>
        <p className="truncate text-xs text-[var(--muted)]">{item.introductionAr}</p>
      </div>
    );
  }

  if (resource === "universities") {
    const item = record as University;
    return (
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm text-[var(--navy)]">
          {item.country?.nameAr ?? "—"} <span aria-hidden="true">·</span> {item.cityAr}
        </p>
        {item.universityType ? (
          <p className="text-xs text-[var(--muted)]">
            جامعة {universityTypeLabel(item.universityType)}
          </p>
        ) : null}
      </div>
    );
  }

  if (resource === "scholarships") {
    const item = record as Scholarship;
    const appStatus = item.effectiveApplicationStatus ?? item.applicationStatus;
    return (
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm text-[var(--navy)]">
          {item.country?.nameAr ?? "—"}
          {item.university?.nameAr ? (
            <>
              {" "}
              <span aria-hidden="true">·</span> {item.university.nameAr}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted)]">
          <span>{studyLevelLabel(item.studyLevel)}</span>
          <span aria-hidden="true">·</span>
          <span>{item.fundingType}</span>
          <span aria-hidden="true">·</span>
          <span
            className={
              appStatus === "OPEN" ? "font-semibold text-emerald-700" : "font-medium text-slate-600"
            }
          >
            {appStatus === "OPEN" ? "التقديم مفتوح" : "التقديم مغلق"}
          </span>
          {item.verifiedDeadline ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <CalendarIcon className="size-3.5 text-[var(--gold-dark)]" />
                {displayDate(item.verifiedDeadline)}
              </span>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (resource === "services") {
    const item = record as Service;
    return (
      <p className="line-clamp-1 max-w-md text-sm text-[var(--muted)]">{item.summaryAr}</p>
    );
  }

  const article = record as Article;
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="truncate text-sm text-[var(--navy)]">
        {article.country?.nameAr ?? "مقال عام"}
        {article.university?.nameAr ? (
          <>
            {" "}
            <span aria-hidden="true">·</span> {article.university.nameAr}
          </>
        ) : null}
      </p>
      <p className="truncate text-xs text-[var(--muted)]">{article.summaryAr}</p>
    </div>
  );
}

export function ContentListPage({
  resource,
  searchParams,
}: {
  resource: AdminContentResource;
  searchParams: ListSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const definition = contentDefinitions[resource];
  const filters = useMemo(
    () => parseContentListFilters(resource, searchParams),
    [resource, searchParams],
  );
  const filterValues = filters as Record<string, string | number | undefined>;

  const list = useContentList(resource, filters);
  const selectors = useContentSelectors({
    countries: definition.filters.includes("country") || resource === "scholarships",
    universities: definition.filters.includes("university") || resource === "articles",
    scholarships: resource === "articles",
  });

  const studyLevelCatalog = useScholarshipOptionCatalog("studyLevel");
  const fundingTypeCatalog = useScholarshipOptionCatalog("fundingType");

  const activeCounts = useMemo(
    () => countActiveContentFilters(resource, filterValues),
    [resource, filterValues],
  );

  const hasSecondaryFilters =
    resource === "scholarships" || resource === "universities" || resource === "articles";

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(
    () => activeCounts.secondary > 0,
  );
  const [prevSecondaryCount, setPrevSecondaryCount] = useState(activeCounts.secondary);
  if (activeCounts.secondary !== prevSecondaryCount) {
    setPrevSecondaryCount(activeCounts.secondary);
    if (activeCounts.secondary > 0) {
      setMoreFiltersOpen(true);
    }
  }

  // University search inside Scholarships secondary filters uses 1000ms debounce too.
  const externalUniSearch = String(filterValues.universitySearch ?? "");
  const [uniSearchDraft, setUniSearchDraft] = useState(externalUniSearch);
  const [prevExternalUniSearch, setPrevExternalUniSearch] = useState(externalUniSearch);
  if (externalUniSearch !== prevExternalUniSearch) {
    setPrevExternalUniSearch(externalUniSearch);
    setUniSearchDraft(externalUniSearch);
  }

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

  useEffect(() => {
    if (resource !== "scholarships") return;
    const trimmed = uniSearchDraft.trim();
    const current = String(filterValues.universitySearch ?? "").trim();
    if (trimmed === current) return;
    const timer = setTimeout(() => {
      applyPatch({ universitySearch: trimmed || undefined }, { resetPage: true, replace: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [uniSearchDraft, filterValues.universitySearch, resource, applyPatch]);

  const handleDebouncedSearch = useCallback(
    (nextSearch: string) => {
      applyPatch({ search: nextSearch || undefined }, { resetPage: true, replace: true });
    },
    [applyPatch],
  );

  const countryOptions = useMemo(
    () =>
      (selectors.countries.data?.items ?? []).map((item) => ({
        value: item.slug,
        label: item.nameAr,
        sublabel: item.nameEn ?? item.slug,
      })),
    [selectors.countries.data?.items],
  );

  const universityOptions = useMemo(
    () =>
      (selectors.universities.data?.items ?? []).map((item) => ({
        value: item.slug,
        label: item.nameAr,
        sublabel: item.country?.nameAr ? `${item.country.nameAr} · ${item.cityAr}` : item.cityAr,
      })),
    [selectors.universities.data?.items],
  );

  const scholarshipOptions = useMemo(
    () =>
      (selectors.scholarships.data?.items ?? []).map((item) => ({
        value: item.slug,
        label: item.titleAr,
        sublabel: item.country?.nameAr ?? undefined,
      })),
    [selectors.scholarships.data?.items],
  );

  const studyLevelFilterOptions = useMemo(() => {
    const merged = [...studyLevelCatalog.options];
    const current = filterValues.studyLevel ? String(filterValues.studyLevel) : "";
    if (current && !merged.includes(current)) merged.unshift(current);
    return merged.map((val) => ({ value: val, label: val }));
  }, [studyLevelCatalog.options, filterValues.studyLevel]);

  const fundingTypeFilterOptions = useMemo(() => {
    const merged = [...fundingTypeCatalog.options];
    const current = filterValues.fundingType ? String(filterValues.fundingType) : "";
    if (current && !merged.includes(current)) merged.unshift(current);
    return merged.map((val) => ({ value: val, label: val }));
  }, [fundingTypeCatalog.options, filterValues.fundingType]);

  const programStudyLevelOptions = useMemo(
    () =>
      programStudyLevels.map((value) => ({
        value,
        label: programStudyLevelLabels[value],
      })),
    [],
  );

  const teachingLanguageOptions = useMemo(
    () =>
      teachingLanguages.map((value) => ({
        value,
        label: teachingLanguageLabels[value],
      })),
    [],
  );

  const universityTypeOptions = useMemo(
    () => [
      { value: "PUBLIC", label: "حكومية" },
      { value: "PRIVATE", label: "خاصة" },
    ],
    [],
  );

  const selectedCountryIdForCity = useMemo(() => {
    const slug = filterValues.country ? String(filterValues.country) : undefined;
    if (!slug) return undefined;
    return selectors.countries.data?.items.find((c) => c.slug === slug)?.id;
  }, [filterValues.country, selectors.countries.data?.items]);

  const selectedUniCountryIdForCity = useMemo(() => {
    const slug = filterValues.universityCountry ? String(filterValues.universityCountry) : undefined;
    if (!slug) return undefined;
    return selectors.countries.data?.items.find((c) => c.slug === slug)?.id;
  }, [filterValues.universityCountry, selectors.countries.data?.items]);

  const searchSupported = definition.filters.includes("search");

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--gold-dark)]">إدارة المحتوى</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{definition.label}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{resourceDescriptions[resource]}</p>
        </div>

        <Link
          href={`/admin/${resource}/new`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy-light)] whitespace-nowrap"
        >
          <PlusIcon className="size-4" />
          <span>إضافة {definition.singular}</span>
        </Link>
      </header>

      {/* Independent Wide Search Bar (1000ms Debounce) */}
      <DebouncedSearchBar
        value={String(filterValues.search ?? "")}
        onDebouncedChange={handleDebouncedSearch}
        delayMs={1000}
        disabled={!searchSupported}
        placeholder={searchPlaceholders[resource]}
        ariaLabel={`بحث في ${definition.label}`}
        isFetching={searchSupported && list.isFetching}
        unsupportedNote={
          !searchSupported
            ? "البحث النصي غير متاح لجدول الخدمات حاليًا؛ يتطلب تفعيل معامل search في الخادم."
            : undefined
        }
      />

      {/* Auto-Apply Filter Bar */}
      <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4 text-[var(--gold-dark)]" />
            <h3 className="text-sm font-bold text-[var(--navy)]">التصفية والفرز</h3>
            {activeCounts.total > 0 ? (
              <span className="inline-flex items-center rounded-md bg-[var(--gold-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)] tabular-nums">
                {activeCounts.total} فلتر نشط
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasSecondaryFilters ? (
              <button
                type="button"
                aria-expanded={moreFiltersOpen}
                onClick={() => setMoreFiltersOpen((open) => !open)}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  moreFiltersOpen || activeCounts.secondary > 0
                    ? "border-[var(--gold)] bg-[var(--gold-soft)]/60 text-[var(--navy)]"
                    : "border-[var(--line)] bg-white text-[var(--navy)] hover:bg-slate-50"
                }`}
              >
                <span>فلاتر إضافية</span>
                {activeCounts.secondary > 0 ? (
                  <span className="rounded bg-[var(--navy)] px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                    {activeCounts.secondary}
                  </span>
                ) : null}
                <ChevronDownIcon
                  className={`size-3.5 transition-transform duration-150 ${moreFiltersOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}

            {activeCounts.total > 0 ? (
              <button
                type="button"
                onClick={() => router.push(pathname)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcwIcon className="size-3.5 text-[var(--muted)]" />
                <span>إعادة ضبط</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Primary Filters Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {definition.filters.includes("country") ? (
            <SearchableSelect
              label="الدولة"
              value={String(filterValues.country ?? "")}
              onChange={(value) =>
                applyPatch({
                  country: value || undefined,
                  ...(resource === "universities" ? { city: undefined } : {}),
                })
              }
              options={countryOptions}
              placeholder="كل الدول"
              clearLabel="كل الدول"
              isLoading={selectors.countries.isFetching}
              isError={selectors.countries.isError}
              onRetry={() => void selectors.countries.refetch()}
            />
          ) : null}

          {definition.filters.includes("university") ? (
            <SearchableSelect
              label="الجامعة"
              value={String(filterValues.university ?? "")}
              onChange={(value) => applyPatch({ university: value || undefined })}
              options={universityOptions}
              placeholder="كل الجامعات"
              clearLabel="كل الجامعات"
              isLoading={selectors.universities.isFetching}
              isError={selectors.universities.isError}
              onRetry={() => void selectors.universities.refetch()}
            />
          ) : null}

          {resource === "universities" ? (
            <>
              <DirectorySlugSelect
                kind="cities"
                label="المدينة"
                value={String(filterValues.city ?? "")}
                countryId={selectedCountryIdForCity}
                onChange={(value) => applyPatch({ city: value || undefined })}
                placeholder="كل المدن"
              />
              <DirectorySlugSelect
                kind="academic-majors"
                label="التخصص الأكاديمي"
                value={String(filterValues.major ?? "")}
                onChange={(value) => applyPatch({ major: value || undefined })}
                placeholder="كل التخصصات"
              />
            </>
          ) : null}

          {resource === "scholarships" ? (
            <>
              <SearchableSelect
                label="المستوى الدراسي"
                value={String(filterValues.studyLevel ?? "")}
                onChange={(value) => applyPatch({ studyLevel: value || undefined })}
                options={studyLevelFilterOptions}
                placeholder="كل المستويات"
                clearLabel="كل المستويات"
              />
              <SearchableSelect
                label="نوع التمويل"
                value={String(filterValues.fundingType ?? "")}
                onChange={(value) => applyPatch({ fundingType: value || undefined })}
                options={fundingTypeFilterOptions}
                placeholder="كل أنواع التمويل"
                clearLabel="كل أنواع التمويل"
              />
              <SearchableSelect
                label="حالة التقديم"
                value={String(filterValues.applicationStatus ?? "")}
                onChange={(value) => applyPatch({ applicationStatus: value || undefined })}
                options={[
                  { value: "OPEN", label: "مفتوح" },
                  { value: "CLOSED", label: "مغلق" },
                ]}
                placeholder="جميع الحالات"
                clearLabel="جميع الحالات"
              />
            </>
          ) : null}

          {/* Notice: Services list intentionally omits status filter per approved Phase 2 contract */}
          {definition.filters.includes("status") ? (
            <SearchableSelect
              label="الحالة التحريرية"
              value={String(filterValues.status ?? "")}
              onChange={(value) => applyPatch({ status: value || undefined })}
              options={publicationStatusOptions}
              placeholder="كل الحالات"
              clearLabel="كل الحالات"
            />
          ) : null}

          {definition.filters.includes("sort") ? (
            <div className="min-w-0">
              <label
                htmlFor={`sort-${resource}`}
                className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
              >
                الترتيب
              </label>
              <div className="relative">
                <select
                  id={`sort-${resource}`}
                  value={String(filterValues.sort ?? definition.sorts[0]?.value ?? "newest")}
                  onChange={(event) => applyPatch({ sort: event.target.value || undefined })}
                  className="h-10 w-full appearance-none rounded-lg border border-[var(--line)] bg-white pr-3 pl-9 text-sm text-[var(--navy)] hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                >
                  {definition.sorts.map((sort) => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
            </div>
          ) : null}

          {!hasSecondaryFilters ? (
            <div className="min-w-0">
              <label
                htmlFor={`limit-${resource}`}
                className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
              >
                عدد النتائج
              </label>
              <div className="relative">
                <select
                  id={`limit-${resource}`}
                  value={String(filterValues.limit ?? 12)}
                  onChange={(event) => applyPatch({ limit: Number(event.target.value) })}
                  className="h-10 w-full appearance-none rounded-lg border border-[var(--line)] bg-white pr-3 pl-9 text-sm text-[var(--navy)] tabular-nums hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                >
                  <option value="12">12 سجل</option>
                  <option value="24">24 سجل</option>
                  <option value="50">50 سجل</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
            </div>
          ) : null}

          {definition.filters.includes("featured") ? (
            <div className="flex flex-col justify-end">
              <SwitchToggle
                label="عرض المميزة فقط"
                checked={filterValues.featured === "true"}
                showStarIcon
                onChange={(checked) => applyPatch({ featured: checked ? "true" : undefined })}
              />
            </div>
          ) : null}
        </div>

        {/* Collapsible Secondary Filters ("فلاتر إضافية") */}
        {hasSecondaryFilters && moreFiltersOpen ? (
          <div className="space-y-3 border-t border-[var(--line)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-[var(--navy)]">
                {resource === "scholarships"
                  ? "فلاتر إضافية — تصفية حسب الجامعة المرتبطة وبرامجها"
                  : resource === "articles"
                    ? "فلاتر إضافية — الارتباطات وإعدادات العرض"
                    : "فلاتر إضافية — خصائص البرامج والجامعة"}
              </p>
              {resource === "scholarships" ? (
                <p className="text-[11px] text-[var(--muted)]">
                  تُطبّق هذه المعايير على الجامعة المرتبطة وبرامجها المنشورة.
                </p>
              ) : null}
            </div>

            {resource === "universities" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SearchableSelect
                  label="المستوى الدراسي"
                  value={String(filterValues.studyLevel ?? "")}
                  onChange={(value) => applyPatch({ studyLevel: value || undefined })}
                  options={programStudyLevelOptions}
                  placeholder="كل المستويات"
                  clearLabel="كل المستويات"
                />
                <SearchableSelect
                  label="لغة التدريس"
                  value={String(filterValues.language ?? "")}
                  onChange={(value) => applyPatch({ language: value || undefined })}
                  options={teachingLanguageOptions}
                  placeholder="كل اللغات"
                  clearLabel="كل اللغات"
                />
                <SearchableSelect
                  label="نوع الجامعة"
                  value={String(filterValues.universityType ?? "")}
                  onChange={(value) => applyPatch({ universityType: value || undefined })}
                  options={universityTypeOptions}
                  placeholder="الكل"
                  clearLabel="الكل"
                />
                <div className="min-w-0">
                  <label
                    htmlFor="limit-universities"
                    className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
                  >
                    عدد النتائج
                  </label>
                  <select
                    id="limit-universities"
                    value={String(filterValues.limit ?? 12)}
                    onChange={(event) => applyPatch({ limit: Number(event.target.value) })}
                    className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--navy)] tabular-nums hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                  >
                    <option value="12">12 سجل</option>
                    <option value="24">24 سجل</option>
                    <option value="50">50 سجل</option>
                  </select>
                </div>
              </div>
            ) : null}

            {resource === "scholarships" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                  <label
                    htmlFor="uni-search-filter"
                    className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
                  >
                    بحث اسم الجامعة المرتبطة
                  </label>
                  <input
                    id="uni-search-filter"
                    type="search"
                    maxLength={200}
                    value={uniSearchDraft}
                    onChange={(event) => setUniSearchDraft(event.target.value)}
                    placeholder="اكتب اسم الجامعة..."
                    className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--navy)] placeholder:text-[var(--muted)]/80 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                  />
                </div>
                <SearchableSelect
                  label="دولة الجامعة المرتبطة"
                  value={String(filterValues.universityCountry ?? "")}
                  onChange={(value) =>
                    applyPatch({
                      universityCountry: value || undefined,
                      universityCity: undefined,
                    })
                  }
                  options={countryOptions}
                  placeholder="كل الدول"
                  clearLabel="كل الدول"
                />
                <DirectorySlugSelect
                  kind="cities"
                  label="مدينة الجامعة المرتبطة"
                  value={String(filterValues.universityCity ?? "")}
                  countryId={selectedUniCountryIdForCity}
                  onChange={(value) => applyPatch({ universityCity: value || undefined })}
                  placeholder="كل المدن"
                />
                <DirectorySlugSelect
                  kind="academic-majors"
                  label="تخصص برنامج الجامعة"
                  value={String(filterValues.universityMajor ?? "")}
                  onChange={(value) => applyPatch({ universityMajor: value || undefined })}
                  placeholder="كل التخصصات"
                />
                <SearchableSelect
                  label="مستوى برنامج الجامعة"
                  value={String(filterValues.universityStudyLevel ?? "")}
                  onChange={(value) => applyPatch({ universityStudyLevel: value || undefined })}
                  options={programStudyLevelOptions}
                  placeholder="كل المستويات"
                  clearLabel="كل المستويات"
                />
                <SearchableSelect
                  label="لغة برنامج الجامعة"
                  value={String(filterValues.universityLanguage ?? "")}
                  onChange={(value) => applyPatch({ universityLanguage: value || undefined })}
                  options={teachingLanguageOptions}
                  placeholder="كل اللغات"
                  clearLabel="كل اللغات"
                />
                <SearchableSelect
                  label="نوع الجامعة المرتبطة"
                  value={String(filterValues.universityType ?? "")}
                  onChange={(value) => applyPatch({ universityType: value || undefined })}
                  options={universityTypeOptions}
                  placeholder="الكل"
                  clearLabel="الكل"
                />
                <div className="min-w-0">
                  <label
                    htmlFor="limit-scholarships"
                    className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
                  >
                    عدد النتائج
                  </label>
                  <select
                    id="limit-scholarships"
                    value={String(filterValues.limit ?? 12)}
                    onChange={(event) => applyPatch({ limit: Number(event.target.value) })}
                    className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--navy)] tabular-nums hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                  >
                    <option value="12">12 سجل</option>
                    <option value="24">24 سجل</option>
                    <option value="50">50 سجل</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <SwitchToggle
                    label="عرض المنح التابعة لجامعات مميزة فقط"
                    checked={filterValues.universityFeatured === "true"}
                    onChange={(checked) =>
                      applyPatch({ universityFeatured: checked ? "true" : undefined })
                    }
                  />
                </div>
              </div>
            ) : null}

            {resource === "articles" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <SearchableSelect
                    label="الجامعة المرتبطة (قيد التفعيل في الخادم)"
                    value=""
                    disabled
                    onChange={() => {}}
                    options={universityOptions}
                    placeholder="يتطلب معامل university في الخادم"
                  />
                  <SearchableSelect
                    label="المنحة المرتبطة (قيد التفعيل في الخادم)"
                    value=""
                    disabled
                    onChange={() => {}}
                    options={scholarshipOptions}
                    placeholder="يتطلب معامل scholarship في الخادم"
                  />
                  <div className="min-w-0">
                    <label
                      htmlFor="limit-articles"
                      className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
                    >
                      عدد النتائج
                    </label>
                    <select
                      id="limit-articles"
                      value={String(filterValues.limit ?? 12)}
                      onChange={(event) => applyPatch({ limit: Number(event.target.value) })}
                      className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--navy)] tabular-nums hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                    >
                      <option value="12">12 سجل</option>
                      <option value="24">24 سجل</option>
                      <option value="50">50 سجل</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  ملاحظة تصميمية: تصفية المقالات حسب الجامعة والمنحة مرتبطة بواجهة الخادم وتنتظر إضافة معاملات{" "}
                  <bdi dir="ltr">university / scholarship</bdi> في نقطة نهاية قائمة المقالات.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {resource === "scholarships" &&
        scholarshipUniversityFilterNames.some((key) => Boolean(filterValues[key])) &&
        !moreFiltersOpen ? (
          <p className="text-xs text-[var(--gold-dark)]">
            توجد فلاتر إضافية نشطة للجامعة المرتبطة.
          </p>
        ) : null}
      </div>

      {/* Results Area */}
      {list.isPending ? <TableSkeleton /> : null}

      {list.isError ? (
        <ErrorState
          action={
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"
            >
              إعادة المحاولة
            </button>
          }
        />
      ) : null}

      {!list.isPending && !list.isError && list.data?.items.length === 0 ? (
        <div className="space-y-2">
          <EmptyState />
          {activeCounts.total > 0 ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => router.push(pathname)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] hover:bg-slate-50"
              >
                <RotateCcwIcon className="size-4 text-[var(--muted)]" />
                <span>مسح الفلاتر وعرض كل السجلات</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {list.data?.items.length ? (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">
            <table className="w-full min-w-[740px] border-collapse text-right text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--muted)]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    العنوان
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    التفاصيل
                  </th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap">
                    الحالة
                  </th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap">
                    آخر تحديث
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-left whitespace-nowrap">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {list.data.items.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-[var(--surface-subtle)]/80"
                  >
                    <td className="max-w-xs px-5 py-3.5 align-middle">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/${resource}/${record.id}`}
                            className="truncate font-bold text-[var(--navy)] hover:text-[var(--gold-dark)] hover:underline"
                          >
                            {contentTitle(resource, record)}
                          </Link>
                          {record.featured ? (
                            <span
                              title="محتوى مميز"
                              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--gold-dark)]"
                            >
                              <StarIcon className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                              <span>مميز</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-[var(--muted)]">
                          <bdi dir="ltr">{record.slug}</bdi>
                        </p>
                      </div>
                    </td>

                    <td className="max-w-sm px-5 py-3.5 align-middle">
                      <RecordDetailsCell resource={resource} record={record} />
                    </td>

                    <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>

                    <td className="px-5 py-3.5 align-middle text-xs text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {displayDate(record.updatedAt)}
                    </td>

                    <td className="px-5 py-3.5 text-left align-middle whitespace-nowrap">
                      <Link
                        href={`/admin/${resource}/${record.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:border-[var(--navy)] hover:bg-[var(--navy)] hover:text-white"
                      >
                        <PencilIcon className="size-3.5" />
                        <span>تعديل</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {list.data.items.map((record) => (
              <article
                key={record.id}
                className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="break-words text-base font-bold text-[var(--navy)]">
                      {contentTitle(resource, record)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <bdi dir="ltr">{record.slug}</bdi>
                      {record.featured ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--gold-dark)]">
                            <StarIcon className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
                            <span>مميز</span>
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <StatusBadge status={record.status} />
                </div>

                <div className="border-t border-[var(--line)] pt-2.5">
                  <RecordDetailsCell resource={resource} record={record} />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
                  <span className="tabular-nums">تحديث: {displayDate(record.updatedAt)}</span>
                  <Link
                    href={`/admin/${resource}/${record.id}`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--navy)] px-3.5 text-xs font-semibold text-white"
                  >
                    <PencilIcon className="size-3.5" />
                    <span>تعديل</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Footer */}
          <nav
            aria-label="صفحات النتائج"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"
          >
            <p className="text-xs font-medium text-[var(--muted)] tabular-nums sm:text-sm">
              صفحة <strong className="text-[var(--navy)]">{list.data.pagination.page}</strong> من{" "}
              <strong className="text-[var(--navy)]">
                {Math.max(list.data.pagination.totalPages, 1)}
              </strong>{" "}
              <span aria-hidden="true">·</span> إجمالي{" "}
              <strong className="text-[var(--navy)]">{list.data.pagination.total}</strong> سجل
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPatch(
                    { page: list.data!.pagination.page - 1 },
                    { resetPage: false },
                  )
                }
                disabled={list.data.pagination.page <= 1 || list.isFetching}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronRightIcon className="size-4" />
                <span>السابق</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPatch(
                    { page: list.data!.pagination.page + 1 },
                    { resetPage: false },
                  )
                }
                disabled={
                  list.data.pagination.page >= list.data.pagination.totalPages ||
                  list.isFetching
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>التالي</span>
                <ChevronLeftIcon className="size-4" />
              </button>
            </div>
          </nav>
        </>
      ) : null}
    </section>
  );
}
