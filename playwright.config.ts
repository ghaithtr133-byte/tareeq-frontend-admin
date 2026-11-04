import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3106",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --turbopack --hostname 127.0.0.1 --port 3106",
    url: "http://127.0.0.1:3106/admin",
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "enabled", NEXT_TEST_DIST_DIR: ".next-playwright-3106" },
  },
});
