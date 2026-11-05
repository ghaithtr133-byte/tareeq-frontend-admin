import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { DirectoryPage } from "@/components/universities/directory-page";
export default function AcademicMajorsPage() { return <AdminProtectedShell title="التخصصات الأكاديمية" activeItem="academic-majors"><DirectoryPage kind="academic-majors" /></AdminProtectedShell>; }
