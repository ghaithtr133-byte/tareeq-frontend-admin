import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3206",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --turbopack --hostname localhost --port 3206",
    url: "http://localhost:3206/admin",
    reuseExistingServer: false,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "enabled", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3206", NEXT_TEST_DIST_DIR: ".next-playwright-3206" },
  },
});
