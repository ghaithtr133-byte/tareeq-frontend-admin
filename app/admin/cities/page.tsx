import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { CitiesManagementPage } from "@/components/universities/cities-management-page";

export default function CitiesPage() {
  return <AdminProtectedShell title="المدن" activeItem="cities"><CitiesManagementPage /></AdminProtectedShell>;
}
