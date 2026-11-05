import { defineConfig } from "@playwright/test";
/** Only Phase 2 UI; every API and external asset request is intercepted. No real session or writes. */
export default defineConfig({
  testDir: "./tests/phase2-e2e", fullyParallel: false, workers: 1, timeout: 60_000, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3108", screenshot: "off", trace: "off" },
  webServer: { command: "node ./node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3108", url: "http://127.0.0.1:3108/admin/login", reuseExistingServer: false, timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", NEXT_TEST_DIST_DIR: ".next-phase2-e2e" },
  },
});
