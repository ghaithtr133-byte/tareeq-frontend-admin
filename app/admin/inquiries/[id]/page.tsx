import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SubmissionDetailPage } from "@/components/submissions/submission-detail-page";
import { parseSubmissionFilters, type SubmissionSearchParams } from "@/lib/submissions";

export default async function InquiryDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SubmissionSearchParams>;
}) {
  const { id } = await params;
  const filters = parseSubmissionFilters("inquiries", await searchParams);
  const returnParams = new URLSearchParams();
  returnParams.set("page", String(filters.page ?? 1));
  returnParams.set("sort", filters.sort ?? "newest");
  if (filters.status) returnParams.set("status", filters.status);

  return (
    <AdminProtectedShell title="الاستفسارات العامة" activeItem="inquiries">
      <SubmissionDetailPage
        resource="inquiries"
        id={id}
        returnSearchParams={returnParams.toString()}
      />
    </AdminProtectedShell>
  );
}
