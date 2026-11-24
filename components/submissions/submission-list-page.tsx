"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import {
  applicationTypes,
  submissionStatuses,
  type Submission,
  type SubmissionResource,
} from "@/lib/api-client/submissions";
import {
  useInfiniteSubmissionList,
  useSubmissionList,
} from "@/hook/queries/use-submission-queries";
import {
  applicationTypeLabels,
  parseSubmissionFilters,
  submissionLabels,
  submissionStatusLabels,
  type SubmissionSearchParams,
} from "@/lib/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
} from "@/components/ui/admin-icons";
import {
  SubmissionError,
  SubmissionField,
  SubmissionStatusBadge,
  submissionControlClass,
  submissionDate,
} from "./submission-ui";

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

export function SubmissionListPage({
  resource,
  searchParams,
}: {
  resource: SubmissionResource;
  searchParams: SubmissionSearchParams;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { mockEnabled } = useAdminAccess();
  const desktop = useDesktopLayout();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const parsedFilters = parseSubmissionFilters(resource, searchParams);
  const filters = useMemo(
    () => ({ ...parsedFilters, limit: 12 }),
    [parsedFilters],
  );
  const mobileMode = desktop === false;
  const list = useSubmissionList(
    resource,
    filters,
    desktop === true,
  );
  const mobileFilters = useMemo(() => {
    const { page: _page, limit: _limit, ...rest } = filters;
    void _page;
    void _limit;
    return rest;
  }, [filters]);
  const mobileList = useInfiniteSubmissionList(
    resource,
    mobileFilters,
    5,
    mobileMode,
  );
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = mobileList;

  function navigate(values: Record<string, unknown>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (key === "limit") continue;
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function patchFilters(patch: Record<string, unknown>, resetPage = true) {
    navigate({
      ...filters,
      ...patch,
      ...(resetPage ? { page: 1 } : {}),
    });
  }

  const metadata = list.data?.pagination;
  const mobileItems = useMemo(() => {
    const seen = new Set<string>();
    return (mobileList.data?.pages.flatMap((page) => page.items) ?? []).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [mobileList.data]);
  const items = mobileMode
    ? mobileItems
    : !list.isError
      ? list.data?.items
      : undefined;
  const hasActiveFilters = Boolean(filters.status || filters.applicationType);

  useEffect(() => {
    if (
      !mobileMode ||
      !sentinelRef.current ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    }, { rootMargin: "240px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [mobileMode, fetchNextPage, hasNextPage, isFetchingNextPage]);

  function summary(item: Submission) {
    return "applicationType" in item
      ? applicationTypeLabels[item.applicationType]
      : item.subject;
  }

  function detailLink(item: Submission) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key !== "limit" && value !== undefined) query.set(key, String(value));
    }
    const returnQuery = query.toString();
    return (
      <Link
        href={`/admin/${resource}/${item.id}${returnQuery ? `?${returnQuery}` : ""}`}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:border-[var(--navy)] hover:bg-[var(--navy)] hover:text-white whitespace-nowrap"
        aria-label={`عرض تفاصيل ${item.fullName}`}
      >
        <span>عرض التفاصيل</span>
      </Link>
    );
  }

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <p className="text-xs font-semibold text-[var(--gold-dark)]">متابعة الطلبات</p>
        <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">
          {submissionLabels[resource]}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          مراجعة الطلبات الواردة وتحديث حالة المعالجة والملاحظات الداخلية.
        </p>
      </header>

      {/* Auto-apply Filters Bar */}
      <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4 text-[var(--gold-dark)]" />
            <h3 className="text-sm font-bold text-[var(--navy)]">تصفية النتائج</h3>
          </div>
          {hasActiveFilters ? (
            <Link
              href={pathname}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50"
            >
              <RotateCcwIcon className="size-3.5 text-[var(--muted)]" />
              <span>إعادة ضبط</span>
            </Link>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SubmissionField label="الحالة">
            <select
              name="status"
              value={filters.status ?? ""}
              onChange={(event) =>
                patchFilters({ status: event.target.value || undefined })
              }
              className={submissionControlClass}
            >
              <option value="">كل الحالات</option>
              {submissionStatuses.map((status) => (
                <option key={status} value={status}>
                  {submissionStatusLabels[status]}
                </option>
              ))}
            </select>
          </SubmissionField>

          {resource === "applications" ? (
            <SubmissionField label="نوع الطلب">
              <select
                name="applicationType"
                value={filters.applicationType ?? ""}
                onChange={(event) =>
                  patchFilters({ applicationType: event.target.value || undefined })
                }
                className={submissionControlClass}
              >
                <option value="">كل الأنواع</option>
                {applicationTypes.map((type) => (
                  <option key={type} value={type}>
                    {applicationTypeLabels[type]}
                  </option>
                ))}
              </select>
            </SubmissionField>
          ) : null}

          <SubmissionField label="الترتيب">
            <select
              name="sort"
              value={filters.sort ?? "newest"}
              onChange={(event) => patchFilters({ sort: event.target.value })}
              className={submissionControlClass}
            >
              <option value="newest">الأحدث أولًا</option>
              <option value="oldest">الأقدم أولًا</option>
              <option value="updated">آخر تحديث</option>
            </select>
          </SubmissionField>

        </div>
      </div>

      {mockEnabled ? (
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          معاينة تطوير فقط. استخدم جلسة خادم حقيقية لعرض {submissionLabels[resource]}؛ لا يتم
          الاتصال بالخادم في وضع المعاينة.
        </p>
      ) : (
        <>
          {desktop === undefined || (mobileMode ? mobileList.isPending : list.isPending) ? <LoadingState /> : null}
          {mobileMode ? mobileList.isError ? (
            <SubmissionError error={mobileList.error} retry={() => void mobileList.refetch()} />
          ) : null : list.isError ? (
            <SubmissionError error={list.error} retry={() => void list.refetch()} />
          ) : null}
          {items?.length === 0 && !(mobileMode ? mobileList.isPending || mobileList.isError : list.isPending) ? (
            <EmptyState />
          ) : null}

          {items?.length ? (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">
                <table className="w-full min-w-[760px] border-collapse text-right text-sm">
                  <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--muted)]">
                    <tr>
                      {[
                        "مقدم الطلب",
                        "معلومات التواصل",
                        resource === "applications" ? "نوع الطلب" : "الموضوع",
                        "الحالة",
                        "تاريخ الإرسال",
                        "إجراء",
                      ].map((label) => (
                        <th scope="col" key={label} className="px-4 py-3.5 whitespace-nowrap">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-[var(--surface-subtle)]/80"
                      >
                        <td className="max-w-56 break-words px-4 py-3.5 font-bold text-[var(--navy)]">
                          {item.fullName}
                        </td>
                        <td className="max-w-64 px-4 py-3.5 text-xs text-[var(--muted)]">
                          <bdi dir="ltr" className="block break-all font-medium text-[var(--navy)]">
                            {item.email}
                          </bdi>
                          <bdi dir="ltr" className="block tabular-nums">
                            {item.phone ?? "—"}
                          </bdi>
                        </td>
                        <td className="max-w-64 break-words px-4 py-3.5 text-[var(--navy)]">
                          {summary(item)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <SubmissionStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[var(--muted)] tabular-nums whitespace-nowrap">
                          {submissionDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{detailLink(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words font-bold text-[var(--navy)]">
                        {item.fullName}
                      </h3>
                      <SubmissionStatusBadge status={item.status} />
                    </div>
                    <p className="break-words text-sm text-[var(--navy)]">{summary(item)}</p>
                    <div className="space-y-0.5 text-xs text-[var(--muted)]">
                      <bdi dir="ltr" className="block break-all">
                        {item.email}
                      </bdi>
                      <bdi dir="ltr" className="block tabular-nums">
                        {item.phone ?? "—"}
                      </bdi>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
                      <span className="tabular-nums">{submissionDate(item.createdAt)}</span>
                      {detailLink(item)}
                    </div>
                  </article>
                ))}
              </div>

              {mobileMode ? (
                <div className="space-y-3 md:hidden">
                  <div ref={sentinelRef} aria-hidden="true" />
                  {mobileList.isFetchingNextPage ? (
                    <p role="status" className="py-1 text-center text-xs text-[var(--muted)]">
                      جارٍ تحميل المزيد…
                    </p>
                  ) : null}
                  {mobileList.isError && mobileItems.length ? (
                    <button
                      type="button"
                      onClick={() => void mobileList.fetchNextPage()}
                      className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)]"
                    >
                      إعادة محاولة التحميل
                    </button>
                  ) : mobileList.hasNextPage ? (
                    <button
                      type="button"
                      onClick={() => void mobileList.fetchNextPage()}
                      disabled={mobileList.isFetchingNextPage}
                      className="mx-auto flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--navy)] disabled:opacity-50"
                    >
                      تحميل المزيد
                    </button>
                  ) : (
                    <p className="py-1 text-center text-xs text-[var(--muted)]">تم عرض كل الطلبات.</p>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {!mobileMode && !list.isError && metadata ? (
            <nav
              aria-label="صفحات النتائج"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-xs shadow-[var(--shadow-card)] sm:text-sm"
            >
              <span className="font-medium text-[var(--muted)] tabular-nums">
                صفحة <strong className="text-[var(--navy)]">{metadata.page}</strong> من{" "}
                <strong className="text-[var(--navy)]">
                  {Math.max(metadata.totalPages, 1)}
                </strong>{" "}
                · <strong className="text-[var(--navy)]">{metadata.total}</strong> سجل
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] disabled:opacity-45"
                  disabled={metadata.page <= 1 || list.isFetching}
                  onClick={() => patchFilters({ page: metadata.page - 1 }, false)}
                >
                  <ChevronRightIcon className="size-4" />
                  <span>السابق</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] disabled:opacity-45"
                  disabled={
                    metadata.totalPages === 0 ||
                    metadata.page >= metadata.totalPages ||
                    list.isFetching
                  }
                  onClick={() => patchFilters({ page: metadata.page + 1 }, false)}
                >
                  <span>التالي</span>
                  <ChevronLeftIcon className="size-4" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
