import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SubmissionDetailPage } from "@/components/submissions/submission-detail-page";

export default async function ApplicationDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProtectedShell title="طلبات التقديم" activeItem="applications"><SubmissionDetailPage resource="applications" id={id} /></AdminProtectedShell>;
}
