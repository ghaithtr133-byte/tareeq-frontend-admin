import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { SuperAdminBoundary } from "@/components/layout/super-admin-boundary";
import { AuditPage } from "@/components/phase4/audit-page";
export default function AuditRoute() { return <AdminProtectedShell title="سجل التدقيق" activeItem="audit-log"><SuperAdminBoundary><AuditPage /></SuperAdminBoundary></AdminProtectedShell>; }
