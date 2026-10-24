/** Pure predicate covered by focused tests; the server-only wrapper is the public app entry point. */
export function isAdminDevMockAccessEnabled(environment: NodeJS.ProcessEnv): boolean {
  return environment.NODE_ENV !== "production" && environment.ADMIN_DEV_MOCK_ACCESS === "enabled";
}
