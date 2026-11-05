import { defineConfig } from "@playwright/test";

// Current isolated source in development; final acceptance uses the new production artifact.
const production = process.env.ADMIN_AUDIT_PRODUCTION === "enabled";
export default defineConfig({
  testDir: "./browser",
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  outputDir: "../../test-results/full-coverage-audit",
  use: { baseURL: "http://127.0.0.1:3111", timezoneId: "Asia/Amman", screenshot: "off", trace: "off", serviceWorkers: "block" },
  webServer: {
    cwd: process.cwd(),
    command: `node node_modules/next/dist/bin/next ${production ? "start" : "dev --webpack"} --hostname 127.0.0.1 --port 3111`,
    url: "http://127.0.0.1:3111/admin/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, NEXT_TEST_DIST_DIR: production ? ".next-audit-remediation-build" : ".next-audit-remediation-e2e", ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: production ? "https://api.tareeq-academy.com/api/v1" : "/__dev_api" },
  },
});
