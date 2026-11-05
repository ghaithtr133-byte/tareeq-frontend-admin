import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SiteSettingsPage } from "@/components/settings/site-settings-page";
export default function SettingsRoute() { return <AdminProtectedShell title="إعدادات الموقع" activeItem="settings"><SiteSettingsPage /></AdminProtectedShell>; }
