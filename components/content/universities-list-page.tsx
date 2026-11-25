"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { University, UniversityListParams } from "@/lib/api-client/content";
import { StatusBadge } from "@/components/content/status-badge";
import { DirectorySlugSelect } from "@/components/content/directory-slug-select";
import { ErrorState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, InboxIcon, PencilIcon, PlusIcon, RotateCcwIcon, SearchIcon } from "@/components/ui/admin-icons";
import { useContentList, useContentSelectors, useInfiniteContentList } from "@/hook/queries/use-content-queries";
import { useStudyLanguageCatalog } from "@/hook/queries/use-study-languages";
import { buildContentFilterUrlParams, countActiveContentFilters, parseContentListFilters, type ListSearchParams } from "@/lib/content-filters";
import { programStudyLevelLabels, teachingLanguageLabels, universityTypeLabel } from "@/lib/content-labels";
import { programStudyLevels, teachingLanguages } from "@/lib/university-schemas";

const statusOptions = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
] as const;

const studyLevelOptions = programStudyLevels.map((value) => ({ value, label: programStudyLevelLabels[value] }));
const fallbackLanguageOptions = teachingLanguages.map((value) => ({ value, label: teachingLanguageLabels[value] }));

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

function UniversitiesSkeleton() {
  return (
    <div aria-busy="true" aria-label="جارٍ تحميل الجامعات">
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] lg:block">
        <div className="grid grid-cols-12 gap-3 border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3.5">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-3.5 animate-pulse rounded bg-slate-200/80" />)}
        </div>
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="grid min-h-[72px] grid-cols-12 gap-3 border-b border-[var(--line)] px-4 py-4"><div className="col-span-3 h-4 animate-pulse rounded bg-slate-100" /><div className="col-span-2 h-4 animate-pulse rounded bg-slate-100" /><div className="col-span-2 h-7 animate-pulse rounded bg-slate-100" /><div className="col-span-2 h-7 animate-pulse rounded bg-slate-100" /><div className="col-span-1 h-4 animate-pulse rounded bg-slate-100" /><div className="col-span-2 h-9 animate-pulse rounded bg-slate-100" /></div>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"><div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" /><div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" /><div className="h-7 w-20 animate-pulse rounded bg-slate-100" /></div>)}</div>
    </div>
  );
}

function EmptyUniversities({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return <section className="rounded-2xl border border-[var(--line)] bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-[var(--surface-subtle)] text-[var(--navy)]">{filtered ? <SearchIcon className="size-5" /> : <InboxIcon className="size-5" />}</div><h3 className="mt-3 text-lg font-bold text-[var(--navy)]">{filtered ? "لا توجد جامعات مطابقة" : "لا توجد جامعات مضافة بعد"}</h3><p className="mt-1.5 text-sm text-[var(--muted)]">{filtered ? "غيّر معايير البحث أو التصفية ثم أعد المحاولة." : "أضف أول جامعة لبدء إدارة محتواها وحالة نشرها."}</p>{filtered ? <button type="button" onClick={onReset} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--navy)]"><RotateCcwIcon className="size-4" />إعادة ضبط الفلاتر</button> : <Link href="/admin/universities/new" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white"><PlusIcon className="size-4" />إضافة جامعة</Link>}</section>;
}

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

export function UniversitiesListPage({ searchParams }: { searchParams: ListSearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useDesktopLayout();
  const filters = useMemo(() => parseContentListFilters("universities", searchParams), [searchParams]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const desktopFilters = useMemo(() => ({ ...filters, limit: 12 }), [filters]);
  const mobileFilters = useMemo(() => {
    const { page: _page, limit: _limit, ...rest } = desktopFilters;
    void _page;
    void _limit;
    return rest;
  }, [desktopFilters]);
  const list = useContentList("universities", desktopFilters, desktop === true);
  const mobileList = useInfiniteContentList("universities", mobileFilters, 5, desktop === false);
  const selectors = useContentSelectors({ countries: true });
  const studyLanguageCatalog = useStudyLanguageCatalog();
  const counts = useMemo(() => countActiveContentFilters("universities", filters as Record<string, string | number | undefined>), [filters]);
  const [moreOpen, setMoreOpen] = useState(() => counts.secondary > 0);
  const filtered = counts.total > 0;

  const countryOptions = useMemo(() => (selectors.countries.data?.items ?? []).map((country) => ({ value: country.slug, label: country.nameAr })), [selectors.countries.data?.items]);
  const selectedCountryId = useMemo(() => selectors.countries.data?.items.find((country) => country.slug === filters.country)?.id, [filters.country, selectors.countries.data?.items]);
  const languageOptions = useMemo(() => {
    const options = studyLanguageCatalog.data?.map(({ code, nameAr }) => ({ value: code, label: nameAr })) ?? [...fallbackLanguageOptions];
    if (filters.language && !options.some((option) => option.value === filters.language)) {
      options.push({ value: filters.language, label: teachingLanguageLabels[filters.language] ?? filters.language });
    }
    return options;
  }, [filters.language, studyLanguageCatalog.data]);
  const apply = useCallback((patch: Partial<Record<keyof UniversityListParams, string | number | undefined>>, replace = false, resetPage = true) => {
    const next = buildContentFilterUrlParams(filters as Record<string, string | number | undefined>, patch, { resetPage });
    const target = `${pathname}?${next.toString()}`;
    if (replace) router.replace(target); else router.push(target);
  }, [filters, pathname, router]);
  const reset = useCallback(() => router.push(pathname), [pathname, router]);
  const onCountry = useCallback((country: string) => apply({ country: country || undefined, city: undefined }), [apply]);
  const desktopUniversities = list.data?.items ?? [];
  const mobileUniversities = useMemo(() => {
    const unique = new Map<string, University>();
    for (const page of mobileList.data?.pages ?? []) {
      for (const university of page.items) unique.set(university.id, university);
    }
    return [...unique.values()];
  }, [mobileList.data?.pages]);
  const universities = desktop ? desktopUniversities : mobileUniversities;
  const pagination = list.data?.pagination;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = mobileList;

  useEffect(() => {
    if (desktop !== false || !sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [desktop, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (desktop === undefined) return <UniversitiesSkeleton />;
  const isPending = desktop ? list.isPending : mobileList.isPending;
  const isError = desktop ? list.isError : mobileList.isError;
  const retry = desktop ? () => void list.refetch() : () => void mobileList.refetch();

  return <section className="space-y-4">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-[26px] font-bold tracking-tight text-[var(--navy)] sm:text-[28px]">الجامعات</h2><p className="mt-1 text-[15px] text-[var(--muted)]">إدارة الجامعات ومحتواها وحالات نشرها</p></div><Link href="/admin/universities/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"><PlusIcon className="size-4" />إضافة جامعة</Link></header>

    <DebouncedSearchBar value={filters.search ?? ""} onDebouncedChange={(search) => apply({ search: search || undefined }, true)} delayMs={1000} placeholder="ابحث عن جامعة..." ariaLabel="ابحث عن جامعة" isFetching={desktop ? list.isFetching : mobileList.isFetching} />

    <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-[var(--navy)]">التصفية والفرز</h3>{counts.total ? <span className="rounded-md bg-[var(--gold-soft)] px-2 py-0.5 text-xs font-bold text-[var(--navy)]">{counts.total} فلتر نشط</span> : null}</div><div className="flex gap-2"><button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold text-[var(--navy)]">فلاتر إضافية{counts.secondary ? <span className="rounded bg-[var(--navy)] px-1.5 py-0.5 text-white">{counts.secondary}</span> : null}<ChevronDownIcon className={`size-3.5 ${moreOpen ? "rotate-180" : ""}`} /></button>{filtered ? <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold text-[var(--navy)]"><RotateCcwIcon className="size-3.5" />إعادة ضبط</button> : null}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SearchableSelect label="الدولة" value={filters.country ?? ""} onChange={onCountry} options={countryOptions} placeholder="كل الدول" clearLabel="كل الدول" isLoading={selectors.countries.isFetching} isError={selectors.countries.isError} onRetry={() => void selectors.countries.refetch()} /><SearchableSelect label="حالة النشر" value={filters.status ?? ""} onChange={(status) => apply({ status: status || undefined })} options={statusOptions} placeholder="جميع الحالات" clearLabel="جميع الحالات" /><SearchableSelect label="ترتيب حسب" value={filters.sort ?? "newest"} onChange={(sort) => apply({ sort: sort || undefined })} options={[{ value: "newest", label: "الأحدث أولاً" }, { value: "name", label: "الاسم أبجدياً" }]} allowClear={false} /><div className="flex items-end"><SwitchToggle label="عرض المميزة فقط" checked={filters.featured === "true"} showStarIcon onChange={(checked) => apply({ featured: checked ? "true" : undefined })} /></div></div>
      {moreOpen ? <div className="grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2 lg:grid-cols-4"><SearchableSelect label="نوع الجامعة" value={filters.universityType ?? ""} onChange={(universityType) => apply({ universityType: universityType || undefined })} options={[{ value: "PUBLIC", label: "حكومية" }, { value: "PRIVATE", label: "خاصة" }]} placeholder="جميع الأنواع" clearLabel="جميع الأنواع" /><DirectorySlugSelect kind="cities" label="المدينة" value={filters.city ?? ""} countryId={selectedCountryId} onChange={(city) => apply({ city: city || undefined })} placeholder="كل المدن" /><DirectorySlugSelect kind="academic-majors" label="التخصص" value={filters.major ?? ""} onChange={(major) => apply({ major: major || undefined })} placeholder="كل التخصصات" /><SearchableSelect label="المستوى الدراسي" value={filters.studyLevel ?? ""} onChange={(studyLevel) => apply({ studyLevel: studyLevel || undefined })} options={studyLevelOptions} placeholder="كل المستويات" clearLabel="كل المستويات" /><SearchableSelect label="لغة الدراسة" value={filters.language ?? ""} onChange={(language) => apply({ language: language || undefined })} options={languageOptions} placeholder="كل اللغات" clearLabel="كل اللغات" isLoading={studyLanguageCatalog.isFetching} isError={studyLanguageCatalog.isError} onRetry={() => void studyLanguageCatalog.refetch()} /></div> : null}
    </div>

    {isPending ? <UniversitiesSkeleton /> : isError && universities.length === 0 ? <ErrorState action={<button type="button" onClick={retry} className="rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white">إعادة المحاولة</button>} /> : universities.length === 0 ? <EmptyUniversities filtered={filtered} onReset={reset} /> : <><div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] lg:block"><table className="w-full text-right"><thead className="bg-[var(--surface-subtle)] text-xs text-[var(--muted)]"><tr><th className="px-4 py-3.5 font-semibold">الجامعة</th><th className="px-4 py-3.5 font-semibold">الموقع</th><th className="px-4 py-3.5 font-semibold">نوع الجامعة</th><th className="px-4 py-3.5 font-semibold">حالة النشر</th><th className="px-4 py-3.5 font-semibold">آخر تحديث</th><th className="px-4 py-3.5 font-semibold">الإجراءات</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{desktopUniversities.map((university) => <UniversityRow key={university.id} university={university} />)}</tbody></table></div><div className="grid gap-3 sm:grid-cols-2 lg:hidden">{mobileUniversities.map((university) => <UniversityCard key={university.id} university={university} />)}</div></>}
    {desktop && pagination ? <nav aria-label="صفحات الجامعات" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"><p className="text-[var(--muted)]">صفحة <b className="text-[var(--navy)]">{pagination.page}</b> من <b className="text-[var(--navy)]">{pagination.totalPages}</b> · إجمالي <b className="text-[var(--navy)]">{pagination.total}</b> جامعة</p><div className="flex gap-2"><button type="button" aria-label="السابق" disabled={pagination.page <= 1 || list.isFetching} onClick={() => apply({ page: pagination.page - 1 }, false, false)} className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--line)] disabled:opacity-40"><ChevronRightIcon className="size-4" /></button><button type="button" aria-label="التالي" disabled={pagination.page >= pagination.totalPages || list.isFetching} onClick={() => apply({ page: pagination.page + 1 }, false, false)} className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--line)] disabled:opacity-40"><ChevronLeftIcon className="size-4" /></button></div></nav> : null}
    {desktop === false && universities.length > 0 ? <div className="space-y-3 lg:hidden"><div ref={sentinelRef} aria-hidden="true" />{mobileList.isFetchingNextPage ? <UniversitiesSkeleton /> : null}{mobileList.isError ? <ErrorState action={<button type="button" onClick={() => void mobileList.refetch()} className="rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white">إعادة المحاولة</button>} /> : mobileList.hasNextPage ? <button type="button" onClick={() => void mobileList.fetchNextPage()} disabled={mobileList.isFetchingNextPage} className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] disabled:opacity-50">تحميل المزيد</button> : <p className="py-1 text-center text-xs text-[var(--muted)]">تم عرض كل الجامعات.</p>}</div> : null}
  </section>;
}

function UniversityRow({ university }: { university: University }) { return <tr><td className="px-4 py-4"><div className="flex items-center gap-2"><Link href={`/admin/universities/${university.id}`} className="font-bold text-[var(--navy)] hover:underline">{university.nameAr}</Link>{university.featured ? <span className="rounded border border-[var(--gold)] bg-[var(--gold-soft)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--navy)]">مميزة</span> : null}</div></td><td className="px-4 py-4 text-sm text-[var(--navy)]">{university.country?.nameAr ?? "—"}{university.cityAr ? ` · ${university.cityAr}` : ""}</td><td className="px-4 py-4 text-sm text-[var(--navy)]">{university.universityType ? universityTypeLabel(university.universityType) : "غير محدد"}</td><td className="px-4 py-4"><StatusBadge status={university.status} /></td><td className="px-4 py-4 text-sm tabular-nums text-[var(--muted)]">{dateLabel(university.updatedAt)}</td><td className="px-4 py-4"><Link href={`/admin/universities/${university.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold text-[var(--navy)]"><PencilIcon className="size-3.5" />تعديل</Link></td></tr>; }
function UniversityCard({ university }: { university: University }) { return <article className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-[var(--navy)]">{university.nameAr}</h3><p className="mt-1 text-sm text-[var(--muted)]">{university.country?.nameAr ?? "—"}{university.cityAr ? ` · ${university.cityAr}` : ""}</p></div><StatusBadge status={university.status} /></div><div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-sm"><span className="text-[var(--muted)]">{university.universityType ? universityTypeLabel(university.universityType) : "غير محدد"}</span><span className="text-[var(--muted)]">{dateLabel(university.updatedAt)}</span></div><Link href={`/admin/universities/${university.id}`} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold text-[var(--navy)]"><PencilIcon className="size-3.5" />تعديل</Link></article>; }
