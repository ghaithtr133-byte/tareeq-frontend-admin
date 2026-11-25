import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SubmissionDetailPage } from "@/components/submissions/submission-detail-page";

export default async function InquiryDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProtectedShell title="الاستفسارات العامة" activeItem="inquiries"><SubmissionDetailPage resource="inquiries" id={id} /></AdminProtectedShell>;
}
