import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/phase3-e2e", fullyParallel: false, workers: 1, timeout: 60_000, reporter: "list",
  use: { baseURL: "http://localhost:3209", screenshot: "off", trace: "off" },
  webServer: { command: "node ./node_modules/next/dist/bin/next dev --webpack --hostname localhost --port 3209", url: "http://localhost:3209/admin/login", reuseExistingServer: false, timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", ADMIN_DEV_PROXY_LOCAL_ORIGIN: "http://localhost:3209", NEXT_TEST_DIST_DIR: ".next-phase3-e2e-3209" },
  },
});
