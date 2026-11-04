import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SubmissionListPage } from "@/components/submissions/submission-list-page";
import type { SubmissionSearchParams } from "@/lib/submissions";

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SubmissionSearchParams> }) {
  return (
    <AdminProtectedShell title="الاستفسارات العامة" activeItem="inquiries">
      <SubmissionListPage resource="inquiries" searchParams={await searchParams} />
    </AdminProtectedShell>
  );
}
