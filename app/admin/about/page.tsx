import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SuperAdminBoundary } from "@/components/layout/super-admin-boundary";
import { AboutPage } from "@/components/about/about-page";

export default function AboutRoute() {
  return (
    <AdminProtectedShell title="من نحن" activeItem="about">
      <SuperAdminBoundary>
        <AboutPage />
      </SuperAdminBoundary>
    </AdminProtectedShell>
  );
}
