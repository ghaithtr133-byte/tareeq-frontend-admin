import { SuspendedServicesManagementPage } from "@/components/layout/suspended-services-management-page";
import { isSuspendedManagementPath } from "@/lib/services-management-suspension";

/**
 * Static segment precedence blocks /admin/services plus any nested management
 * URL before the generic [resource] routes can mount their data hooks.
 */
export default async function SuspendedServicesRoute({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  if (!isSuspendedManagementPath(["services", ...segments])) return null;
  return <SuspendedServicesManagementPage />;
}
