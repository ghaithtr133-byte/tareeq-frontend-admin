import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SuperAdminBoundary } from "@/components/layout/super-admin-boundary";
import { AccountsPage } from "@/components/phase4/accounts-page";
export default function AccountsRoute() { return <AdminProtectedShell title="إدارة المشرفين" activeItem="admins"><SuperAdminBoundary><AccountsPage /></SuperAdminBoundary></AdminProtectedShell>; }
