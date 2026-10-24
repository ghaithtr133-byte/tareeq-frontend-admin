import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/admin",
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "enabled", NEXT_TEST_DIST_DIR: ".next-playwright" },
  },
});
