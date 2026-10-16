import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

/**
 * API-domain HttpOnly cookies are unavailable to this server component, so the
 * client dashboard verifies the session through the approved browser /auth/me flow.
 */
export default function AdminIndexPage() {
  return <AdminDashboard />;
}
