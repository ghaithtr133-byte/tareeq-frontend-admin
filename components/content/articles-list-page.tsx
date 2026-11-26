"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { Article, ArticleListParams, PublicationStatus } from "@/lib/api-client/content";
import { ArticleHardDeleteDialog } from "@/components/content/article-hard-delete-dialog";
import { ErrorState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import { useContentSelectors, useContentList, useInfiniteContentList } from "@/hook/queries/use-content-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import type { ListSearchParams } from "@/lib/content-filters";
import {
  activeArticlesAdditionalFilters,
  ARTICLES_MOBILE_PAGE_LIMIT,
  ARTICLE_STATUS_FILTER_OPTIONS,
  ARTICLE_STATUS_LABELS,
  buildArticlesFilterUrlParams,
  formatArticleDate,
  formatArticlesPaginationSummary,
  hasActiveArticlesFilters,
  parseArticlesListFilters,
} from "@/lib/articles-list-helpers";

const statusStyles: Record<PublicationStatus, string> = {
  DRAFT: "border-amber-200/90 bg-amber-50/90 text-amber-900",
  PUBLISHED: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

function ArticleStatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${statusStyles[status]}`}>
      {status === "PUBLISHED" ? <CheckIcon className="size-3.5 text-emerald-700" /> : null}
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}

function ArticleRelations({ article }: { article: Article }) {
  if (!article.country?.nameAr && !article.university?.nameAr) {
    return <span className="text-[13px] text-[var(--muted)]">غير مرتبط</span>;
  }
  return (
    <div className="min-w-0 space-y-0.5 text-[13px] text-[var(--navy)]">
      {article.country?.nameAr ? <p className="truncate">{article.country.nameAr}</p> : null}
      {article.university?.nameAr ? <p className="truncate text-[var(--muted)]">{article.university.nameAr}</p> : null}
    </div>
  );
}

function ArticleSkeleton({ mobileOnly = false }: { mobileOnly?: boolean }) {
  return (
    <div aria-busy="true" aria-label={mobileOnly ? "جارٍ تحميل المزيد من المقالات" : "جارٍ تحميل المقالات"}>
      <div className={`${mobileOnly ? "" : "hidden lg:block"} overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)]`}>
        <div className="divide-y divide-[var(--line)]">
          {Array.from({ length: mobileOnly ? 2 : 5 }).map((_, index) => (
            <div key={index} className="grid min-h-[76px] grid-cols-12 items-center gap-3 px-4 py-3.5">
              <div className="col-span-4 space-y-2"><div className="h-4 w-48 animate-pulse rounded bg-slate-200/80" /><div className="h-3 w-36 animate-pulse rounded bg-slate-100" /></div>
              <div className="col-span-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="col-span-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
              <div className="col-span-2 h-4 w-20 animate-pulse rounded bg-slate-100" />
              <div className="col-span-2 h-9 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      {!mobileOnly ? <div className="grid gap-3 lg:hidden">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl border border-[var(--line)] bg-white" />)}</div> : null}
    </div>
  );
}

function ArticlesEmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-3.5 grid size-12 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--navy)]">
        {filtered ? <SearchIcon className="size-5" /> : <InboxIcon className="size-5" />}
      </div>
      <h3 className="text-lg font-bold text-[var(--navy)]">{filtered ? "لا توجد مقالات مطابقة" : "لا توجد مقالات مضافة بعد"}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[var(--muted)]">
        {filtered ? "لم يتم العثور على مقالات تطابق البحث أو الفلاتر الحالية." : "أضف أول مقال لبدء إدارة المحتوى وحالات النشر."}
      </p>
      <div className="mt-5 flex justify-center">
        {filtered ? <button type="button" onClick={onReset} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] hover:bg-slate-50"><RotateCcwIcon className="size-4" />إعادة ضبط الفلاتر</button> : <Link href="/admin/articles/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"><PlusIcon className="size-4" />إضافة مقال</Link>}
      </div>
    </section>
  );
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

export function ArticlesListPage({ searchParams }: { searchParams: ListSearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const access = useAdminAccess();
  const desktop = useDesktopLayout();
  const filters = useMemo(() => parseArticlesListFilters(searchParams), [searchParams]);
  const filtersActive = useMemo(() => hasActiveArticlesFilters(filters), [filters]);
  const additionalCount = useMemo(() => activeArticlesAdditionalFilters(filters), [filters]);
  const [additionalOpen, setAdditionalOpen] = useState(() => additionalCount > 0);
  const [previousAdditionalCount, setPreviousAdditionalCount] = useState(additionalCount);
  const [articleToDelete, setArticleToDelete] = useState<Article>();
  const [notice, setNotice] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  if (additionalCount !== previousAdditionalCount) {
    setPreviousAdditionalCount(additionalCount);
    if (additionalCount) setAdditionalOpen(true);
  }

  const applyPatch = useCallback((patch: Partial<Record<keyof ArticleListParams, string | number | undefined>>, resetPage = true) => {
    const params = buildArticlesFilterUrlParams(filters, patch, { resetPage });
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  const handleSearch = useCallback((search: string) => {
    applyPatch({ search: search || undefined });
  }, [applyPatch]);
  const reset = useCallback(() => router.push(pathname), [pathname, router]);

  const selectors = useContentSelectors({ countries: true });
  const desktopList = useContentList("articles", filters, desktop === true);
  const infiniteFilters = useMemo(
    () => ({
      search: filters.search,
      country: filters.country,
      status: filters.status,
      featured: filters.featured,
      sort: filters.sort,
    }),
    [filters.country, filters.featured, filters.search, filters.sort, filters.status],
  );
  const mobileList = useInfiniteContentList("articles", infiniteFilters, ARTICLES_MOBILE_PAGE_LIMIT, desktop === false);

  const countryOptions = useMemo(() => (selectors.countries.data?.items ?? []).map((country) => ({
    value: country.slug,
    label: country.nameAr,
    sublabel: country.nameEn ?? country.slug,
  })), [selectors.countries.data?.items]);

  const mobileArticles = useMemo(() => {
    const unique = new Map<string, Article>();
    for (const page of mobileList.data?.pages ?? []) {
      for (const article of page.items) unique.set(article.id, article);
    }
    return [...unique.values()];
  }, [mobileList.data?.pages]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = mobileList;

  useEffect(() => {
    if (desktop !== false || !sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [desktop, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (desktop === undefined) return <ArticleSkeleton />;

  const desktopItems = desktopList.data?.items ?? [];
  const desktopPagination = desktopList.data?.pagination;
  const visibleItems = desktop ? desktopItems : mobileArticles;
  const isPending = desktop ? desktopList.isPending : mobileList.isPending;
  const isError = desktop ? desktopList.isError : mobileList.isError;
  const retry = desktop ? () => void desktopList.refetch() : () => void mobileList.refetch();
  const canHardDelete = !access.mockEnabled && (access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");

  return (
    <section className="space-y-4">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--navy)] sm:text-[28px]">المقالات</h2>
          <p className="mt-1 text-[15px] leading-6 text-[var(--muted)]">إدارة المقالات وحالات نشرها والمحتوى المرتبط بها</p>
        </div>
        <Link href="/admin/articles/new" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy-light)]"><PlusIcon className="size-4" />إضافة مقال</Link>
      </header>

      <DebouncedSearchBar value={filters.search ?? ""} onDebouncedChange={handleSearch} delayMs={1000} placeholder="ابحث عن مقال..." ariaLabel="بحث في المقالات" isFetching={desktop ? desktopList.isFetching : mobileList.isFetching} />
      {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p> : null}

      <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-3.5 shadow-[var(--shadow-card)] sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchableSelect id="articles-status-filter" label="حالة النشر" value={filters.status ?? ""} onChange={(status) => applyPatch({ status: status || undefined })} options={ARTICLE_STATUS_FILTER_OPTIONS} placeholder="جميع الحالات" clearLabel="جميع الحالات" searchPlaceholder="ابحث في حالات النشر..." />
          <SwitchToggle id="articles-featured-filter" label="عرض المميزة فقط" checked={filters.featured === "true"} showStarIcon onChange={(checked) => applyPatch({ featured: checked ? "true" : undefined })} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
          <button type="button" aria-expanded={additionalOpen} onClick={() => setAdditionalOpen((open) => !open)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${additionalOpen || additionalCount ? "border-[var(--gold)] bg-[var(--gold-soft)]/60 text-[var(--navy)]" : "border-[var(--line)] bg-white text-[var(--navy)] hover:bg-slate-50"}`}>
            فلاتر إضافية{additionalCount ? <span className="rounded bg-[var(--navy)] px-1.5 py-0.5 text-[11px] text-white">{additionalCount}</span> : null}<ChevronDownIcon className={`size-3.5 transition-transform ${additionalOpen ? "rotate-180" : ""}`} />
          </button>
          {filtersActive ? <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50"><RotateCcwIcon className="size-3.5" />إعادة ضبط</button> : null}
        </div>

        {additionalOpen ? <div className="space-y-3 border-t border-[var(--line)] pt-3">
          <SearchableSelect id="articles-country-filter" label="الدولة المرتبطة" value={filters.country ?? ""} onChange={(country) => applyPatch({ country: country || undefined })} options={countryOptions} placeholder="الكل" clearLabel="الكل" isLoading={selectors.countries.isFetching} isError={selectors.countries.isError} onRetry={() => void selectors.countries.refetch()} />
          <p className="text-[11px] leading-5 text-[var(--muted)]">لا يدعم عقد قائمة المقالات الحالي التصفية حسب الجامعة أو المنحة المرتبطة؛ لم تُضف تصفية محلية بديلة.</p>
        </div> : null}
      </div>

      {isPending ? <ArticleSkeleton /> : null}
      {isError ? <ErrorState action={<button type="button" onClick={retry} className="rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white">إعادة المحاولة</button>} /> : null}
      {!isPending && !isError && visibleItems.length === 0 ? <ArticlesEmptyState filtered={filtersActive} onReset={reset} /> : null}

      {!isPending && !isError && visibleItems.length > 0 ? <>
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] lg:block">
          <table className="w-full min-w-[940px] border-collapse text-right">
            <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[13px] font-semibold text-[var(--muted)]"><tr>
              <th scope="col" className="px-4 py-3.5">المقال</th><th scope="col" className="px-4 py-3.5">المحتوى المرتبط</th><th scope="col" className="px-4 py-3.5">حالة النشر</th><th scope="col" className="px-4 py-3.5">تاريخ النشر</th><th scope="col" className="px-4 py-3.5">آخر تحديث</th><th scope="col" className="px-4 py-3.5 text-left">الإجراءات</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--line)]">{desktopItems.map((article) => <tr key={article.id} className="transition-colors hover:bg-[var(--surface-subtle)]/80">
              <td className="max-w-sm px-4 py-3.5"><Link href={`/admin/articles/${article.id}`} className="block truncate font-bold text-[var(--navy)] hover:text-[var(--gold-dark)] hover:underline">{article.titleAr}</Link><div className="mt-1 flex items-center gap-2"><p className="line-clamp-1 text-[13px] text-[var(--muted)]">{article.summaryAr}</p>{article.featured ? <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--gold-dark)]"><StarIcon className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />مميز</span> : null}</div></td>
              <td className="px-4 py-3.5"><ArticleRelations article={article} /></td><td className="px-4 py-3.5"><ArticleStatusBadge status={article.status} /></td><td className="px-4 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{article.publishedAt ? formatArticleDate(article.publishedAt) : "لم يُنشر"}</td><td className="px-4 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{formatArticleDate(article.updatedAt)}</td>
              <td className="px-4 py-3.5 text-left"><div className="flex items-center justify-end gap-2"><Link href={`/admin/articles/${article.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--navy)] hover:border-[var(--navy)] hover:bg-[var(--navy)] hover:text-white"><PencilIcon className="size-3.5" />تعديل</Link>{canHardDelete ? <button type="button" onClick={() => { setNotice(""); setArticleToDelete(article); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[13px] font-semibold text-red-700 hover:bg-red-50"><TrashIcon className="size-3.5" />حذف</button> : null}</div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div role="list" aria-label="بطاقات المقالات" className="space-y-3 lg:hidden">{mobileArticles.map((article) => <article key={article.id} role="listitem" className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-base font-bold text-[var(--navy)]">{article.titleAr}</h3>{article.summaryAr ? <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--muted)]">{article.summaryAr}</p> : null}</div><ArticleStatusBadge status={article.status} /></div>
          <div className="flex flex-wrap items-center gap-2 border-y border-[var(--line)] py-2.5"><ArticleRelations article={article} />{article.featured ? <span className="inline-flex items-center gap-1 rounded-md border border-[var(--gold)]/40 bg-[var(--gold-soft)]/75 px-2 py-0.5 text-[12px] font-semibold text-[var(--navy)]"><StarIcon className="size-3 fill-[var(--gold)] text-[var(--gold)]" />مميز</span> : null}</div>
          <div className="flex items-center justify-between gap-3 text-[13px] text-[var(--muted)]"><span>{article.publishedAt ? `نُشر: ${formatArticleDate(article.publishedAt)}` : `تحديث: ${formatArticleDate(article.updatedAt)}`}</span><div className="flex items-center gap-2"><Link href={`/admin/articles/${article.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[var(--navy)] px-3.5 text-xs font-semibold text-white"><PencilIcon className="size-3.5" />تعديل</Link>{canHardDelete ? <button type="button" onClick={() => { setNotice(""); setArticleToDelete(article); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50" aria-label={`حذف ${article.titleAr}`}><TrashIcon className="size-3.5" />حذف</button> : null}</div></div>
        </article>)}</div>

        {desktop && desktopPagination ? <nav aria-label="صفحات المقالات" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-card)]"><p className="text-[13px] text-[var(--muted)]">{formatArticlesPaginationSummary(desktopPagination.page, desktopPagination.limit, desktopPagination.total)} · صفحة <b className="text-[var(--navy)]">{desktopPagination.page}</b> من <b className="text-[var(--navy)]">{Math.max(desktopPagination.totalPages, 1)}</b></p><div className="flex gap-2"><button type="button" disabled={desktopPagination.page <= 1 || desktopList.isFetching} onClick={() => applyPatch({ page: desktopPagination.page - 1 }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] disabled:opacity-45"><ChevronRightIcon className="size-4" />السابق</button><button type="button" disabled={desktopPagination.page >= desktopPagination.totalPages || desktopList.isFetching} onClick={() => applyPatch({ page: desktopPagination.page + 1 }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] disabled:opacity-45">التالي<ChevronLeftIcon className="size-4" /></button></div></nav> : null}

        {desktop === false ? <div className="space-y-3 lg:hidden"><div ref={sentinelRef} aria-hidden="true" />{mobileList.isFetchingNextPage ? <ArticleSkeleton mobileOnly /> : null}{mobileList.hasNextPage ? <button type="button" onClick={() => void mobileList.fetchNextPage()} disabled={mobileList.isFetchingNextPage} className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] disabled:opacity-50">تحميل المزيد</button> : <p className="py-1 text-center text-xs text-[var(--muted)]">تم عرض كل المقالات.</p>}</div> : null}
      </> : null}
      {articleToDelete ? <ArticleHardDeleteDialog article={articleToDelete} onClose={() => setArticleToDelete(undefined)} onDeleted={() => { setArticleToDelete(undefined); setNotice("تم حذف المقال نهائياً بنجاح."); }} /> : null}
    </section>
  );
}
