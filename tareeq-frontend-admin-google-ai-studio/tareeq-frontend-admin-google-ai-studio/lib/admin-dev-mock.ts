import "server-only";

import { isAdminDevMockAccessEnabled as isEnabled } from "@/lib/admin-dev-mock-gate";

/**
 * The server is the sole authority for enabling local mock access. Keeping the
 * flag out of NEXT_PUBLIC_* variables prevents a browser value from becoming
 * an authentication bypass.
 */
export function isAdminDevMockAccessEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return isEnabled(environment);
}
