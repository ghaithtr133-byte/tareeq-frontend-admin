import { defineConfig } from "@playwright/test";
/** Only Phase 2 UI; every API and external asset request is intercepted. No real session or writes. */
export default defineConfig({
  testDir: "./tests/phase2-e2e", fullyParallel: false, workers: 1, timeout: 60_000, reporter: "list",
  use: { baseURL: "http://localhost:3208", screenshot: "off", trace: "off" },
  webServer: { command: "node ./node_modules/next/dist/bin/next dev --webpack --hostname localhost --port 3208", url: "http://localhost:3208/admin/login", reuseExistingServer: false, timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3208", NEXT_TEST_DIST_DIR: ".next-phase2-e2e-3208" },
  },
});
