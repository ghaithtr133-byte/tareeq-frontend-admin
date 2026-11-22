import { defineConfig } from "@playwright/test";

/** Real frontend transport/session logic; every API response is intercepted in tests. */
export default defineConfig({
  testDir: "./tests/submissions-e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://localhost:3207", screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --turbopack --hostname localhost --port 3207",
    url: "http://localhost:3207/admin/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3207", NEXT_TEST_DIST_DIR: ".next-submissions-e2e-3207" },
  },
});
