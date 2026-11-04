import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SubmissionListPage } from "@/components/submissions/submission-list-page";
import type { SubmissionSearchParams } from "@/lib/submissions";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<SubmissionSearchParams> }) {
  return (
    <AdminProtectedShell title="طلبات التقديم" activeItem="applications">
      <SubmissionListPage resource="applications" searchParams={await searchParams} />
    </AdminProtectedShell>
  );
}
