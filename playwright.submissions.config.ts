import { defineConfig } from "@playwright/test";

/** Real frontend transport/session logic; every API response is intercepted in tests. */
export default defineConfig({
  testDir: "./tests/submissions-e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3107", screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --turbopack --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107/admin/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", NEXT_TEST_DIST_DIR: ".next-submissions-e2e" },
  },
});
