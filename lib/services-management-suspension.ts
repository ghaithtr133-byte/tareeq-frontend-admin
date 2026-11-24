/**
 * Single, reversible UI switch for TA-105. API contracts and historical
 * Service records remain available; only the Admin management surface is
 * suspended.
 */
export const suspendedManagementResource = "services" as const;

export function isManagementResourceSuspended(resource: string): boolean {
  return resource === suspendedManagementResource;
}

/** Covers /admin/services and every present or future nested Services URL. */
export function isSuspendedManagementPath(segments: readonly string[]): boolean {
  return segments[0] === suspendedManagementResource;
}
