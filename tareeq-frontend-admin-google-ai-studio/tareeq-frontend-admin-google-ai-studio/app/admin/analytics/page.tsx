import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SuperAdminBoundary } from "@/components/layout/super-admin-boundary";
import { AnalyticsPage } from "@/components/phase4/analytics-page";
export default function AnalyticsRoute() { return <AdminProtectedShell title="التحليلات" activeItem="analytics"><SuperAdminBoundary><AnalyticsPage /></SuperAdminBoundary></AdminProtectedShell>; }
