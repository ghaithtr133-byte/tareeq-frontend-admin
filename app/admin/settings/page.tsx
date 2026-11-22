import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SuperAdminBoundary } from "@/components/layout/super-admin-boundary";
import { SiteSettingsPage } from "@/components/settings/site-settings-page";

export default function SettingsRoute() {
  return (
    <AdminProtectedShell title="إعدادات الموقع" activeItem="settings">
      <SuperAdminBoundary>
        <SiteSettingsPage />
      </SuperAdminBoundary>
    </AdminProtectedShell>
  );
}
