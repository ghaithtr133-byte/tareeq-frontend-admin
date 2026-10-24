"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { AdminContentResource, ContentRecord, ContentTypeMap, Country, PublicationStatus, Scholarship, ScholarshipApplicationStatus, Service, University } from "@/api/content";
import { ErrorState, EmptyState, LoadingState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import { useContentSelectors, useContentList } from "@/hook/queries/use-content-queries";
import { contentDefinitions, contentTitle, publicationStatusOptions } from "@/lib/content-config";

type SearchParams = Record<string, string | string[] | undefined>;

function one(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}
function positive(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : fallback;
}
function allowed<T extends string>(value: string | undefined, options: readonly T[]): T | undefined {
  return value && options.includes(value as T) ? value as T : undefined;
}
function displayDate(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

function parseFilters<K extends AdminContentResource>(resource: K, params: SearchParams): ContentTypeMap[K]["params"] {
  const definition = contentDefinitions[resource];
  const output: Record<string, string | number | undefined> = {
    page: positive(one(params, "page"), 1, Number.MAX_SAFE_INTEGER),
    limit: positive(one(params, "limit"), 12, 50),
  };
  const strings = ["search", "country", "university", "studyLevel", "fundingType"] as const;
  for (const key of strings) if (definition.filters.includes(key) && one(params, key)?.trim()) output[key] = one(params, key)!.trim();
  if (definition.filters.includes("featured")) output.featured = allowed(one(params, "featured"), ["true", "false"]);
  if (definition.filters.includes("status")) output.status = allowed(one(params, "status"), ["DRAFT", "PUBLISHED", "ARCHIVED"] satisfies PublicationStatus[]);
  if (definition.filters.includes("applicationStatus")) output.applicationStatus = allowed(one(params, "applicationStatus"), ["OPEN", "CLOSED"] satisfies ScholarshipApplicationStatus[]);
  if (definition.filters.includes("sort")) output.sort = allowed(one(params, "sort"), definition.sorts.map((sort) => sort.value));
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value !== undefined)) as ContentTypeMap[K]["params"];
}

function FilterSelect({ name, label, defaultValue, children }: { name: string; label: string; defaultValue?: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]"><span>{label}</span><select name={name} defaultValue={defaultValue ?? ""} className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-normal"><option value="">الكل</option>{children}</select></label>;
}

function recordDetails(resource: AdminContentResource, record: ContentRecord) {
  if (resource === "countries") return `ترتيب العرض: ${(record as Country).displayOrder}`;
  if (resource === "universities") { const item = record as University; return `${item.country?.nameAr ?? "—"} · ${item.cityAr}`; }
  if (resource === "scholarships") { const item = record as Scholarship; return `${item.country?.nameAr ?? "—"} · ${item.effectiveApplicationStatus ?? item.applicationStatus}`; }
  if (resource === "services") return `ترتيب العرض: ${(record as Service).displayOrder}`;
  return (record as import("@/api/content").Article).country?.nameAr ?? "—";
}

export function ContentListPage({ resource, searchParams }: { resource: AdminContentResource; searchParams: SearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const definition = contentDefinitions[resource];
  const filters = parseFilters(resource, searchParams);
  const filterValues = filters as Record<string, string | number | undefined>;
  const list = useContentList(resource, filters);
  const selectors = useContentSelectors({
    countries: definition.filters.includes("country"),
    universities: definition.filters.includes("university"),
  });

  function update(values: FormData | Record<string, string | number | undefined>) {
    const next = new URLSearchParams();
    const entries = values instanceof FormData ? [...values.entries()] : Object.entries(values);
    for (const [key, value] of entries) {
      const text = String(value).trim();
      if (text) next.set(key, text);
    }
    if (!next.has("page")) next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  function changePage(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== undefined) params.set(key, String(value));
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold text-[var(--gold)]">إدارة المحتوى</p><h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{definition.label}</h2></div>
        <Link href={`/admin/${resource}/new`} className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white hover:bg-[var(--navy-light)]">إضافة {definition.singular}</Link>
      </div>

      <form key={JSON.stringify(filters)} onSubmit={(event) => { event.preventDefault(); update(new FormData(event.currentTarget)); }} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-5">
        {definition.filters.includes("search") ? <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]"><span>بحث</span><input name="search" defaultValue={String(filterValues.search ?? "")} className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm" placeholder="ابحث في المحتوى" /></label> : null}
        {definition.filters.includes("country") ? <FilterSelect name="country" label="الدولة" defaultValue={String(filterValues.country ?? "")}>{selectors.countries.data?.items.map((country) => <option key={country.id} value={country.slug}>{country.nameAr}</option>)}</FilterSelect> : null}
        {definition.filters.includes("university") ? <FilterSelect name="university" label="الجامعة" defaultValue={String(filterValues.university ?? "")}>{selectors.universities.data?.items.map((university) => <option key={university.id} value={university.slug}>{university.nameAr}</option>)}</FilterSelect> : null}
        {definition.filters.includes("studyLevel") ? <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]"><span>المستوى الدراسي</span><input name="studyLevel" defaultValue={String(filterValues.studyLevel ?? "")} className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm" /></label> : null}
        {definition.filters.includes("fundingType") ? <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]"><span>نوع التمويل</span><input name="fundingType" defaultValue={String(filterValues.fundingType ?? "")} className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm" /></label> : null}
        {definition.filters.includes("applicationStatus") ? <FilterSelect name="applicationStatus" label="حالة التقديم" defaultValue={String(filterValues.applicationStatus ?? "")}><option value="OPEN">مفتوح</option><option value="CLOSED">مغلق</option></FilterSelect> : null}
        {definition.filters.includes("featured") ? <FilterSelect name="featured" label="مميز" defaultValue={String(filterValues.featured ?? "")}><option value="true">مميز</option><option value="false">غير مميز</option></FilterSelect> : null}
        {definition.filters.includes("status") ? <FilterSelect name="status" label="الحالة" defaultValue={String(filterValues.status ?? "")}>{publicationStatusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</FilterSelect> : null}
        {definition.filters.includes("sort") ? <FilterSelect name="sort" label="الترتيب" defaultValue={String(filterValues.sort ?? "")}>{definition.sorts.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</FilterSelect> : null}
        <FilterSelect name="limit" label="لكل صفحة" defaultValue={String(filterValues.limit ?? 12)}><option value="12">12</option><option value="24">24</option><option value="50">50</option></FilterSelect>
        <div className="flex items-end gap-2"><button className="h-10 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white">تطبيق</button><Link href={pathname} className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] px-3 text-sm font-semibold text-[var(--navy)]">إعادة ضبط</Link></div>
      </form>

      {list.isPending ? <LoadingState /> : null}
      {list.isError ? <ErrorState action={<button type="button" onClick={() => void list.refetch()} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white">إعادة المحاولة</button>} /> : null}
      {list.data?.items.length === 0 ? <EmptyState /> : null}
      {list.data?.items.length ? <>
        <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] bg-white shadow-sm md:block"><table className="w-full min-w-[700px] text-right text-sm"><thead className="bg-[var(--gold-soft)] text-xs text-[var(--navy)]"><tr><th className="px-5 py-4">العنوان</th><th className="px-5 py-4">التفاصيل</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">آخر تحديث</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody>{list.data.items.map((record) => <tr key={record.id} className="border-t border-[var(--line)]"><td className="px-5 py-4 font-bold text-[var(--navy)]">{contentTitle(resource, record)}</td><td className="px-5 py-4 text-[var(--muted)]">{recordDetails(resource, record)}</td><td className="px-5 py-4"><StatusBadge status={record.status} /></td><td className="px-5 py-4 text-[var(--muted)]">{displayDate(record.updatedAt)}</td><td className="px-5 py-4"><Link href={`/admin/${resource}/${record.id}`} className="font-bold text-[var(--navy)] underline">تعديل</Link></td></tr>)}</tbody></table></div>
        <div className="space-y-3 md:hidden">{list.data.items.map((record) => <article key={record.id} className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="font-bold text-[var(--navy)]">{contentTitle(resource, record)}</h3><StatusBadge status={record.status} /></div><p className="mt-2 text-sm text-[var(--muted)]">{recordDetails(resource, record)}</p><div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]"><span>{displayDate(record.updatedAt)}</span><Link href={`/admin/${resource}/${record.id}`} className="font-bold text-[var(--navy)] underline">تعديل</Link></div></article>)}</div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-3 text-sm"><span>صفحة {list.data.pagination.page} من {Math.max(list.data.pagination.totalPages, 1)} · {list.data.pagination.total} سجل</span><div className="flex gap-2"><button type="button" onClick={() => changePage(list.data!.pagination.page - 1)} disabled={list.data.pagination.page <= 1} className="rounded-lg border border-[var(--line)] px-3 py-2 disabled:opacity-40">السابق</button><button type="button" onClick={() => changePage(list.data!.pagination.page + 1)} disabled={list.data.pagination.page >= list.data.pagination.totalPages} className="rounded-lg border border-[var(--line)] px-3 py-2 disabled:opacity-40">التالي</button></div></div>
      </> : null}
    </section>
  );
}
