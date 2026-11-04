"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import { applicationTypes, submissionStatuses, type Submission, type SubmissionResource } from "@/api/submissions";
import { useSubmissionList } from "@/hook/queries/use-submission-queries";
import { applicationTypeLabels, parseSubmissionFilters, submissionLabels, submissionStatusLabels, type SubmissionSearchParams } from "@/lib/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { SubmissionError, SubmissionField, SubmissionStatusBadge, submissionButtonClass, submissionControlClass, submissionDate } from "./submission-ui";

export function SubmissionListPage({ resource, searchParams }: { resource: SubmissionResource; searchParams: SubmissionSearchParams }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mockEnabled } = useAdminAccess();
  const filters = parseSubmissionFilters(resource, searchParams);
  const list = useSubmissionList(resource, filters);
  function navigate(values: Record<string, unknown>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
    router.push(`${pathname}?${params}`);
  }
  const metadata = list.data?.pagination;
  const items = !list.isError ? list.data?.items : undefined;
  function summary(item: Submission) { return "applicationType" in item ? applicationTypeLabels[item.applicationType] : item.subject; }
  function detail(item: Submission) { return <Link href={`/admin/${resource}/${item.id}`} className="inline-flex min-h-11 items-center font-bold text-[var(--navy)] underline" aria-label={`عرض تفاصيل ${item.fullName}`}>عرض التفاصيل</Link>; }
  return <section className="min-w-0 space-y-5">
    <h2 className="text-2xl font-bold text-[var(--navy)]">{submissionLabels[resource]}</h2>
    <form key={JSON.stringify(filters)} onSubmit={(event) => { event.preventDefault(); navigate({ ...Object.fromEntries(new FormData(event.currentTarget)), page: 1 }); }} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
      <SubmissionField label="الحالة"><select name="status" defaultValue={filters.status ?? ""} className={submissionControlClass}><option value="">الكل</option>{submissionStatuses.map((status) => <option key={status} value={status}>{submissionStatusLabels[status]}</option>)}</select></SubmissionField>
      {resource === "applications" ? <SubmissionField label="نوع الطلب"><select name="applicationType" defaultValue={filters.applicationType ?? ""} className={submissionControlClass}><option value="">الكل</option>{applicationTypes.map((type) => <option key={type} value={type}>{applicationTypeLabels[type]}</option>)}</select></SubmissionField> : null}
      <SubmissionField label="الترتيب"><select name="sort" defaultValue={filters.sort} className={submissionControlClass}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option><option value="updated">آخر تحديث</option></select></SubmissionField>
      <SubmissionField label="لكل صفحة"><select name="limit" defaultValue={filters.limit} className={submissionControlClass}>{[...new Set([12, 24, 50, filters.limit!])].sort((a, b) => a - b).map((limit) => <option key={limit} value={limit}>{limit}</option>)}</select></SubmissionField>
      <div className="flex flex-wrap items-end gap-2"><button className={submissionButtonClass}>تطبيق</button><Link href={pathname} className="inline-flex min-h-11 items-center text-sm font-bold underline">إعادة ضبط</Link></div>
    </form>
    {mockEnabled ? <p className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm">معاينة تطوير فقط. استخدم جلسة حقيقية لعرض الطلبات والاستفسارات؛ لا يتم الاتصال بالخادم في وضع المعاينة.</p> : <>
      {list.isPending ? <LoadingState /> : null}
      {list.isError ? <SubmissionError error={list.error} retry={() => void list.refetch()} /> : null}
      {items?.length === 0 ? <EmptyState /> : null}
      {items?.length ? <>
        <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] bg-white md:block"><table className="w-full min-w-[760px] text-right text-sm"><thead className="bg-[var(--gold-soft)] text-[var(--navy)]"><tr>{["الاسم", "معلومات التواصل", resource === "applications" ? "نوع الطلب" : "الموضوع", "الحالة", "تاريخ الإرسال", "إجراء"].map((label) => <th scope="col" key={label} className="px-4 py-4">{label}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-[var(--line)]"><td className="max-w-56 break-words px-4 py-3 font-bold">{item.fullName}</td><td className="max-w-64 px-4 py-3"><bdi dir="ltr" className="block break-all">{item.email}</bdi><bdi dir="ltr" className="block">{item.phone ?? "—"}</bdi></td><td className="max-w-64 break-words px-4 py-3">{summary(item)}</td><td className="px-4 py-3"><SubmissionStatusBadge status={item.status} /></td><td className="px-4 py-3">{submissionDate(item.createdAt)}</td><td className="px-4 py-3">{detail(item)}</td></tr>)}</tbody></table></div>
        <div className="space-y-3 md:hidden">{items.map((item) => <article key={item.id} className="space-y-3 rounded-xl border border-[var(--line)] bg-white p-4"><div className="flex items-start justify-between gap-2"><h3 className="min-w-0 break-words font-bold">{item.fullName}</h3><SubmissionStatusBadge status={item.status} /></div><p className="break-words">{summary(item)}</p><bdi dir="ltr" className="block break-all text-sm">{item.email}</bdi><bdi dir="ltr" className="block text-sm">{item.phone ?? "—"}</bdi><p className="text-sm text-[var(--muted)]">{submissionDate(item.createdAt)}</p>{detail(item)}</article>)}</div>
      </> : null}
      {!list.isError && metadata ? <nav aria-label="صفحات النتائج" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm"><span>صفحة {metadata.page} من {Math.max(metadata.totalPages, 1)} · {metadata.total} سجل</span><div className="flex gap-2"><button className={submissionButtonClass} disabled={metadata.page <= 1 || list.isFetching} onClick={() => navigate({ ...filters, page: metadata.page - 1 })}>السابق</button><button className={submissionButtonClass} disabled={metadata.totalPages === 0 || metadata.page >= metadata.totalPages || list.isFetching} onClick={() => navigate({ ...filters, page: metadata.page + 1 })}>التالي</button></div></nav> : null}
    </>}
  </section>;
}
