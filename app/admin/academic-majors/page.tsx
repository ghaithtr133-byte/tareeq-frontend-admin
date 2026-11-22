import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { AcademicMajorsManagementPage } from "@/components/universities/academic-majors-management-page";

export default function AcademicMajorsPage() {
  return <AdminProtectedShell title="التخصصات الأكاديمية" activeItem="academic-majors"><AcademicMajorsManagementPage /></AdminProtectedShell>;
}
